FROM adoptopenjdk/openjdk11-openj9:jdk-11.0.1.13-alpine-slim

EXPOSE 8080

RUN mkdir -p /root/cozycast/cozycast-server
COPY gradle /root/cozycast/cozycast-server/gradle
COPY gradlew /root/cozycast/cozycast-server/gradlew
WORKDIR /root/cozycast/cozycast-server
RUN ./gradlew

COPY . /root/cozycast/cozycast-server
RUN ./gradlew assemble

ENV JAVA_OPTS="$JAVA_OPS -Xms32M -Xmx64M"

CMD java -Dcom.sun.management.jmxremote -noverify ${JAVA_OPTS} -jar build/libs/cozycast-server-*-all.jar
