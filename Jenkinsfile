node {
  withCredentials([string(credentialsId: 'boundlessgeoadmin-token', variable: 'GITHUB_TOKEN'), string(credentialsId: 'sonar-jenkins-pipeline-token', variable: 'SONAR_TOKEN')]) {

    currentBuild.result = "SUCCESS"

    try {
      stage('Checkout'){
        checkout scm
          echo "Running ${env.BUILD_ID} on ${env.JENKINS_URL}"
      }


      stage('Test'){
        // make build
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                     -c 'yarn install && yarn test'
          """
      }

      stage('Coverage'){
        // make lint
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                     -c 'yarn cover'
          """
      }

      stage('SonarQube Analysis') {
          sh """
            docker run -v \$(pwd -P):/web \
                       -w /web quay.io/boundlessgeo/node-yarn-sonar \
                       bash -c 'sonar-scanner \
                                         -Dsonar.host.url=https://sonar-ciapi.boundlessgeo.io \
                                         -Dsonar.login=$SONAR_TOKEN \
                                         -Dsonar.projectKey=web-sdk \
                                         -Dsonar.sources=src \
                                         -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'
            """
      }

    }
    catch (err) {

      currentBuild.result = "FAILURE"
        throw err
    } finally {
      // Success or failure, always send notifications
      echo currentBuild.result
    }

  }
}
