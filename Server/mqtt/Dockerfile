FROM debian:bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    build-essential \
    libc6-dev \
    libssl-dev \
    pkg-config \
    mosquitto \
    mosquitto-clients \
    mosquitto-dev \
    libmosquitto-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

# Install Go 1.23
WORKDIR /tmp
RUN wget https://go.dev/dl/go1.23.3.linux-amd64.tar.gz && \
    rm -rf /usr/local/go && \
    tar -C /usr/local -xzf go1.23.3.linux-amd64.tar.gz && \
    rm go1.23.3.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"

# Clone plugin
WORKDIR /build
RUN git clone https://github.com/iegomez/mosquitto-go-auth.git

# Build plugin using official Makefile
WORKDIR /build/mosquitto-go-auth
RUN make

# Prepare mosquitto
RUN mkdir -p /etc/mosquitto/plugins
RUN mkdir -p /etc/mosquitto/conf.d

# plugin compiled by make sits in project root as go-auth.so
RUN cp go-auth.so /etc/mosquitto/plugins/

COPY mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY config/go-auth.json /etc/mosquitto/conf.d/go-auth.json

EXPOSE 1883 9001

CMD ["mosquitto", "-c", "/etc/mosquitto/mosquitto.conf"]
