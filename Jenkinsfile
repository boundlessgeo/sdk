node {
  withCredentials([string(credentialsId: 'boundlessgeoadmin-token', variable: 'GITHUB_TOKEN'), string(credentialsId: 'sonar-jenkins-pipeline-token', variable: 'SONAR_TOKEN')]) {

    currentBuild.result = "SUCCESS"

    try {
      stage('Checkout'){
        checkout scm
          echo "Running ${env.BUILD_ID} on ${env.JENKINS_URL}"
      }


      stage('Package'){
        // make build
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web node:8.9.4 sh \
                     -c 'bash -c "npm install" &&
                         bash -c "npm run test"'
          """
      }

      stage('Coverage'){
        // make lint
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web node:8.9.4 sh -c 'bash -c "npm run cover"'
          """
      }

      stage('SonarQube Analysis') {
          sh """
            docker run -v \$(pwd -P):/web \
                       -w /web node:8.9.4 \
                       bash -c 'npm i -g sonarqube-scanner && sonar-scanner \
                                         -Dsonar.host.url=https://sonar-ciapi.boundlessgeo.io \
                                         -Dsonar.login=$SONAR_TOKEN \
                                         -Dsonar.projectKey=web-sdk \
                                         -Dsonar.sources=src/'
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
