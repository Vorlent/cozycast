#!/bin/bash
source ../.env
export MAVEN_OPTS="-Xmx100m -Xms50m"
./mvnw compile exec:java
