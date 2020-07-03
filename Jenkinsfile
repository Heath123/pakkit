pipeline {
    agent any
    tools {
        nodejs 'Node 12'
    }
    stages {
        stage('build') {
            steps {
                sh 'npm install'
                sh 'node-prune'
                sh 'npx electron-forge package --platform win32'
                sh 'npx electron-forge package --platform linux'
                sh 'npx electron-forge package --platform darwin'
                sh 'mv out/pakkit-win32-x64 out/pakkit-windows-x64'
                sh 'mv out/pakkit-darwin-x64 out/pakkit-macos-x64'
                sh 'zip -r out/pakkit-windows-x64.zip out/pakkit-windows-x64/'
                sh 'zip -r out/pakkit-linux-x64.zip out/pakkit-linux-x64/'
                sh 'zip -r -y out/pakkit-macos-x64.zip out/pakkit-macos-x64/'
            }
            post {
                success {
                    archiveArtifacts artifacts: '**/out/*.zip', fingerprint: true
                    withCredentials([usernamePassword(credentialsId: 'GitHubPAToken', usernameVariable: 'USERNAME', passwordVariable: 'TOKEN')]) {
                        sh 'export GITHUB_TOKEN=$TOKEN'
                        sh 'echo "Creating a new release in github"'
                        sh 'github-release release --user ${GITHUB_ORGANIZATION} --repo ${GITHUB_REPO} --tag ${VERSION_NAME} --name "${VERSION_NAME}"'
                        sh 'echo "Uploading the artifacts into github"'
                        sh 'github-release upload --user ${GITHUB_ORGANIZATION} --repo ${GITHUB_REPO} --tag ${VERSION_NAME} --name "pakkit-windows-x64.zip" --file out/pakkit-windows-x64.zip'
                        sh 'github-release upload --user ${GITHUB_ORGANIZATION} --repo ${GITHUB_REPO} --tag ${VERSION_NAME} --name "pakkit-linux-x64.zip" --file out/pakkit-linux-x64.zip'
                        sh 'github-release upload --user ${GITHUB_ORGANIZATION} --repo ${GITHUB_REPO} --tag ${VERSION_NAME} --name "pakkit-macos-x64.zip" --file out/pakkit-macos-x64.zip'
                    }
                }
            }
        }
    }
    post {
        always {
            deleteDir()
        }
    }
}
