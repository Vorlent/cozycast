FROM eclipse-temurin:11.0.20_8-jdk-jammy

EXPOSE 8080

RUN apt-get update && apt-get install -y inotify-tools

RUN mkdir -p /root/cozycast/cozycast-server
COPY gradle /root/cozycast/cozycast-server/gradle
COPY gradlew /root/cozycast/cozycast-server/gradlew
WORKDIR /root/cozycast/cozycast-server
RUN ./gradlew

COPY . /root/cozycast/cozycast-server
RUN ./gradlew assemble

ENV JAVA_OPTS="$JAVA_OPS -Xms32M -Xmx128M"

CMD java -Dcom.sun.management.jmxremote -noverify ${JAVA_OPTS} -jar build/libs/cozycast-server-*-all.jar
