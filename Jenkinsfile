node {
  withCredentials([
    string(credentialsId: 'boundlessgeoadmin-token', variable: 'GITHUB_TOKEN'),
    string(credentialsId: 'sq-boundlessgeo-token', variable: 'SONAR_TOKEN'),
    string(credentialsId: 'sonarqube-github-token', variable: 'SONAR_GITHUB_TOKEN'),
    string(credentialsId: 'NPM_TOKEN', variable: 'NPM_TOKEN'),
  ]) {
    try {
      stage('Checkout'){
        checkout scm
          echo "Running ${env.BUILD_ID} on ${env.JENKINS_URL}"
      }

      stage('Test'){
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                     -c 'npm install && npm run test'
          """
      }

      stage('Coverage'){
        sh """
          docker run -v \$(pwd -P):/web \
                     -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                     -c 'npm run cover'
          """
      }

      stage('Publish online examples and docs'){
          sh """
            docker run -v \$(pwd -P):/web \
                     -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                     -c 'npm i \
                       && npm run bundle-examples \
                       && npm run jsdoc \
                       && npm run create:archive \
                       && ssh root@sdk.boundlessgeo.com 'rm -rf /var/www/*' \
                       && scp build/sdk-examples.tgz root@sdk.boundlessgeo.com:/tmp \
                       && ssh root@sdk.boundlessgeo.com 'tar -xzpf /tmp/sdk-examples.tgz -C /var/www/'
          """
      }

      if (env.CHANGE_ID != null) {

        stage('SonarQube GitHub PR') {

          sh """
            docker run -v \$(pwd -P):/web \
                       -w /web quay.io/boundlessgeo/b7s-sonarqube-scanner \
                       bash -c 'sonar-scanner -Dsonar.analysis.mode=preview \
                                              -Dsonar.github.pullRequest=${env.CHANGE_ID} \
                                              -Dsonar.projectKey=web-sdk \
                                              -Dsonar.sources=src \
                                              -Dsonar.projectName=web-sdk \
                                              -Dsonar.github.repository=boundlessgeo/sdk \
                                              -Dsonar.github.oauth=${SONAR_GITHUB_TOKEN} \
                                              -Dsonar.host.url=https://sq.boundlessgeo.io \
                                              -Dsonar.login=$SONAR_TOKEN'
            """
        }
      }

      if (env.BRANCH_NAME == 'master'){

        stage('SonarQube Analysis'){
          def projectVersion = (env.CHANGE_ID != null) ? "${env.BUILD_NUMBER}.${env.CHANGE_ID}" : "${env.BUILD_NUMBER}"
          sh """
            docker run -v \$(pwd -P):/web \
                         -w /web quay.io/boundlessgeo/b7s-sonarqube-scanner bash \
                         -c 'dependency-check --project web-sdk \
                                --disableBundleAudit \
                                --disableAssembly \
                                --out . \
                                --scan . \
                                -f ALL \
                             && sonar-scanner -Dsonar.host.url=https://sq.boundlessgeo.io \
                                              -Dsonar.login=$SONAR_TOKEN \
                                              -Dsonar.projectKey=web-sdk \
                                              -Dsonar.projectVersion=${projectVersion} \
                                              -Dsonar.projectName=web-sdk \
                                              -Dsonar.dependencyCheck.reportPath=dependency-check-report.xml \
                                              -Dsonar.dependencyCheck.htmlReportPath=dependency-check-report.html \
                                              -Dsonar.sources=src \
                                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'
          """
        }
      }

      if (gitTagCheck()) {
        stage('Create release') {
            sh """
              docker run -v \$(pwd -P):/web \
                         -w /web quay.io/boundlessgeo/node-yarn-sonar bash \
                         -c 'echo "//registry.npmjs.org/:_authToken=${env.NPM_TOKEN}" > ~/.npmrc && npm install && npm run dist && cd dist && npm publish'
              """
        }
      }

      currentBuild.result = "SUCCESS"
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
