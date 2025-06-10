FROM node:24-alpine

# Install build tools and python3 with pip
RUN apk add --no-cache gcc python3 py3-pip

# Create a virtual environment for Python packages not available via apk
RUN python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --upgrade pip setuptools && \
    pip install awscli==1.16.27

# Ensure the virtualenv's bin directory is in PATH for all future RUN, CMD, ENTRYPOINT
ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 4000
ENV PORT=4000
WORKDIR /app

ARG APPLICATION_VERSION
ENV EQ_AUTHOR_API_VERSION $APPLICATION_VERSION
ENV AWS_DEFAULT_REGION eu-west-1
ENV NODE_ENV production

ENTRYPOINT ["./docker-entrypoint.sh"]

COPY . /app
RUN yarn install --frozen-lockfile
