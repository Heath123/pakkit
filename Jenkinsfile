pipeline {
    agent any
    tools {
        nodejs 'Node 12'
        jdk 'Java 8'
    }
    stages {
        stage('build') {
            steps {
                sh 'npm install'
                sh 'node-prune'
                sh 'cd node_modules/java/; node postInstall.js; cd ../..'
                sh 'npx electron-forge package --platform win32'
                sh 'npx electron-forge package --platform linux'
                sh 'npx electron-forge package --platform darwin'
                sh 'mv out/pakkit-win32-x64 pakkit-windows-x64'
                sh 'mv out/pakkit-linux-x64 pakkit-linux-x64'
                sh 'mv out/pakkit-darwin-x64 pakkit-macos-x64'
                sh 'zip -r -y out/pakkit-windows-x64.zip pakkit-windows-x64/'
                sh 'zip -r -y out/pakkit-linux-x64.zip pakkit-linux-x64/'
                sh 'zip -r -y out/pakkit-macos-x64.zip pakkit-macos-x64/'
            }
            post {
                success {
                    archiveArtifacts artifacts: '**/out/*.zip', fingerprint: true
                    script {
                        if (env.BRANCH_NAME == 'master') {
                            withCredentials([usernamePassword(credentialsId: 'GitHubPAToken', usernameVariable: 'USERNAME', passwordVariable: 'GITHUB_TOKEN')]) {
                                sh 'echo "Creating a new release in github"'
                                sh 'github-release release --user Heath123 --repo pakkit --tag v${BUILD_NUMBER} --name "Jenkins build ${BUILD_NUMBER}"'
                                sh 'echo "Uploading the artifacts into github"'
                                sh 'github-release upload --user Heath123 --repo pakkit --tag v${BUILD_NUMBER} --name "pakkit-windows-x64.zip" --file out/pakkit-windows-x64.zip'
                                sh 'github-release upload --user Heath123 --repo pakkit --tag v${BUILD_NUMBER} --name "pakkit-linux-x64.zip" --file out/pakkit-linux-x64.zip'
                                sh 'github-release upload --user Heath123 --repo pakkit --tag v${BUILD_NUMBER} --name "pakkit-macos-x64.zip" --file out/pakkit-macos-x64.zip'
                            }
                        }
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
