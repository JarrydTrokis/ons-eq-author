const express = require("express");
const { ApolloServer } = require("@apollo/server");
const cors = require("cors");
const pinoMiddleware = require("express-pino-logger");
const helmet = require("helmet");
const noir = require("pino-noir");
const bodyParser = require("body-parser");
const http = require("http");
const { expressMiddleware } = require('@as-integrations/express5');


const status = require("./middleware/status");
const { getLaunchUrl } = require("./middleware/launch");
const loadQuestionnaire = require("./middleware/loadQuestionnaire");
const runQuestionnaireMigrations = require("./middleware/runQuestionnaireMigrations");
const exportQuestionnaire = require("./middleware/export");
const exportQuestionnaireByVersionId = require("./middleware/export-version");
const importQuestionnaire = require("./middleware/import");
const identificationMiddleware = require("./middleware/identification");
const getUserFromHeaderBuilder = require("./middleware/identification/getUserFromHeader");
const upsertUser = require("./middleware/identification/upsertUser");
const rejectUnidentifiedUsers = require("./middleware/identification/rejectUnidentifiedUsers");
const validateQuestionnaire = require("./middleware/validateQuestionnaire");
const convertQuestionnaire = require("./middleware/convertQuestionnaire");
const loadComments = require("./middleware/loadComments");

const schema = require("./schema");

const createApp = () => {
  const app = express();
  const pino = pinoMiddleware({
    serializers: noir(["req.headers.authorization"], "[Redacted]"),
  });
  const logger = pino.logger;

  let extensions = [];
  if (process.env.ENABLE_OPENTRACING === "true") {
    const OpentracingExtension = require("apollo-opentracing").default;
    const { localTracer, serverTracer } = require("./tracer").tracer(logger);
    extensions = [
      () =>
        new OpentracingExtension({
          server: serverTracer,
          local: localTracer,
        }),
    ];
  }

  if (process.env.CORS_WHITELIST) {
    const whitelist = process.env.CORS_WHITELIST.split(",");

    const corsOptions = {
      origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    };

    app.use(cors(corsOptions));
  } else {
    app.use(cors());
  }

  const getUserFromHeader = getUserFromHeaderBuilder(logger);
  const server = new ApolloServer({
    ...schema,
    context: (...args) => {
      const { req, connection } = args[0];
      if (connection) {
        // check connection for metadata
        return connection.context;
      }
      return {
        questionnaire: req.questionnaire,
        user: req.user,
        comments: req.comments,
        validationErrorInfo: req.validationErrorInfo,
      };
    },
    subscriptions: {
      onConnect: async (params, _, ctx) => {
        const user = await getUserFromHeader(params.authorization);
        ctx.user = user;
        return {
          user,
        };
      },
    },
    plugins: extensions,
  });

  server.start().then(() => {
    logger.info("Apollo Server started");

    app.use(
      "/graphql",
      expressMiddleware(server),
      helmet({
        referrerPolicy: {
          policy: "no-referrer",
        },
        frameguard: {
          action: "deny",
        },
        hsts: {
          maxAge: 15552000,
          includeSubDomains: true,
        },
        noSniff: true,
        crossDomain: {
          permittedPolicies: "none",
        },
        clearSiteData: ["cache", "cookies", "storage"],
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: "same-origin",
        crossOriginResourcePolicy: "same-origin",
        permissionsPolicy: {
          features: {
            accelerometer: [],
            autoplay: [],
            camera: [],
            displayCapture: [],
            documentDomain: [],
            encryptedMedia: [],
            fullscreen: [],
            geolocation: [],
            gyroscope: [],
            magnetometer: [],
            microphone: [],
            midi: [],
            payment: [],
            pictureInPicture: [],
            publickeyCredentialsGet: [],
            screenWakeLock: [],
            syncXhr: ["self"],
            usb: [],
            webShare: [],
            xrSpatialTracking: [],
          },
        },
        cacheControl: {
          noStore: true,
          maxAge: 0,
        },
        pragma: "no-cache",
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            objectSrc: ["'none'"],
            childSrc: ["'self'"],
            frameAncestors: ["'none"],
            upgradeInsecureRequests: ["true"],
            blockAllMixedContent: ["true"],
            baseUri: ["'none'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            styleSrc: [
              "'self'",
              "http://cdn.jsdelivr.net/npm/@apollographql/",
              "https://fonts.googleapis.com",
              // These will change with graphql server versions
              "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
              "'sha256-iRiwFogHwyIOlQ0vgwGxLZXMnuPZa9eZnswp4v8s6fE='",
              "'sha256-WYkrRZYpK8d/rqMjoMTIfcPzRxeojQUncPzhW9/2pg8='",
              "'sha256-jQoC6QpIonlMBPFbUGlJFRJFFWbbijMl7Z8XqWrb46o='",
            ],
            scriptSrc: [
              "'self'",
              "https://www.googleapis.com/identitytoolkit/v3",
              "http://cdn.jsdelivr.net/npm/@apollographql/",
              "'sha256-qQ+vMtTOJ7ZAi9QUiV74BIEp2+xQJt7uiJ47QICu6xI='",
            ],
            imgSrc: ["'self'", "http://cdn.jsdelivr.net/npm/@apollographql/"],
          },
        },
      }),
      pino,
      identificationMiddleware(logger),
      rejectUnidentifiedUsers,
      loadQuestionnaire,
      runQuestionnaireMigrations(logger)(require("./migrations")),
      loadComments,
      validateQuestionnaire
    );
  });

  app.get("/status", status);

  app.get("/launch/:questionnaireId", getLaunchUrl);

  app.get("/convert/:questionnaireId", convertQuestionnaire);

  app.get("/export/:questionnaireId", exportQuestionnaire);
  if (process.env.ENABLE_IMPORT === "true") {
    app
      .use(bodyParser.json({ limit: "10mb", extended: true }))
      .post(
        "/import",
        identificationMiddleware(logger),
        rejectUnidentifiedUsers,
        importQuestionnaire
      );
  }
  app.get(
    "/export/:questionnaireId/version/:versionId",
    exportQuestionnaireByVersionId
  );

  app.post("/signIn", identificationMiddleware(logger), upsertUser);

  const httpServer = http.createServer(app);

  logger.info(`🚀 Server ready at ${server.graphqlPath}`);
  logger.info(`🚀 Subscriptions ready at ${server.subscriptionsPath}`);
  return httpServer;
};

module.exports = {
  createApp,
};
