const { findIndex, merge } = require("lodash");

const { getName } = require("../../../utils/getName");

const {
  getPagesFromSection,
  getPageById,
  getSectionByPageId,
  getFolderById,
  getFoldersBySectionId,
  createFolder,
  createQuestionPage,
} = require("../utils");
const { createMutation } = require("../createMutation");

const {
  ROUTING_ANSWER_TYPES,
} = require("../../../constants/routingAnswerTypes");

const availableRoutingDestinations = require("../../../src/businessLogic/availableRoutingDestinations");
const getPreviousAnswersForPage = require("../../../src/businessLogic/getPreviousAnswersForPage");
const Resolvers = {};

Resolvers.QuestionPage = {
  section: ({ id }, input, ctx) => {
    // this not returning new section information when moved
    const section = getSectionByPageId(ctx, id);
    return section;
  },
  position: ({ id }, args, ctx) => {
    // need to double check this
    const section = getSectionByPageId(ctx, id);
    return findIndex(getPagesFromSection(section), { id });
  },
  displayName: page => getName(page, "QuestionPage"),
  availablePipingAnswers: ({ id }, args, ctx) =>
    getPreviousAnswersForPage(ctx.questionnaire, id),
  availablePipingMetadata: (page, args, ctx) => ctx.questionnaire.metadata,
  availableRoutingAnswers: (page, args, ctx) =>
    getPreviousAnswersForPage(
      ctx.questionnaire,
      page.id,
      true,
      ROUTING_ANSWER_TYPES
    ),
  availableRoutingDestinations: ({ id }, args, ctx) => {
    // will need to double check this
    const {
      logicalDestinations,
      sections,
      questionPages,
    } = availableRoutingDestinations(ctx.questionnaire, id);

    return {
      logicalDestinations,
      sections,
      pages: questionPages,
    };
  },
  validationErrorInfo: ({ id }, args, ctx) => {
    const pageErrors = ctx.validationErrorInfo.filter(
      ({ pageId }) => id === pageId
    );
    //remove qcode errors from total here - important as Qcode errors don't count to total
    // otherwise error totals get confusing for users!!!!!!

    const answerErrorsQCode = pageErrors.filter(
      ({ field }) => field === "qCode" || field === "secondaryQCode"
    );

    return {
      id,
      errors: pageErrors,
      totalCount: pageErrors.length - answerErrorsQCode.length,
    };
  },
};

Resolvers.Mutation = {
  createQuestionPage: createMutation(
    (root, { input: { position, ...pageInput } }, ctx) => {
      const page = createQuestionPage(pageInput);
      const { folderId, sectionId } = pageInput;

      if (folderId) {
        const folder = getFolderById(ctx, folderId);
        const insertPosition = position > -1 ? position : folder.pages.length;
        folder.pages.splice(insertPosition, 0, page);
      } else {
        const folders = getFoldersBySectionId(ctx, sectionId);
        const insertPosition = position > -1 ? position : folders.length;
        const folder = createFolder({ pages: [page] });
        folders.splice(insertPosition, 0, folder);
      }

      return page;
    }
  ),
  updateQuestionPage: createMutation((_, { input }, ctx) => {
    const page = getPageById(ctx, input.id);
    merge(page, input);
    return page;
  }),
};

module.exports = { Resolvers, createQuestionPage };
