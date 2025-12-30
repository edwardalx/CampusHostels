pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Build and Deploy') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@''' + env.HOST_IP + ''' "
                            set -e
                            cd ''' + env.PROJECT_DIR + '''
                            git stash || true
                            git pull origin main
                            
                            cd frontend/campushostel-fe
                            
                            for i in 1 2 3; do
                                echo 'Build attempt $i'
                                rm -rf node_modules package-lock.json 2>/dev/null || true
                                
                                if [ $i -eq 1 ]; then
                                    npm install --legacy-peer-deps
                                elif [ $i -eq 2 ]; then
                                    npm install --force --legacy-peer-deps
                                else
                                    npm install --no-optional --legacy-peer-deps --ignore-scripts
                                fi
                                
                                if npm run build; then
                                    echo '✅ Build successful on attempt $i'
                                    break
                                elif [ $i -eq 3 ]; then
                                    echo '❌ All build attempts failed'
                                    exit 1
                                else
                                    echo '⚠️ Build failed, retrying...'
                                    sleep 5
                                fi
                            done
                            
                            if [ ! -f 'dist/index.html' ]; then
                                echo '❌ Build verification failed'
                                exit 1
                            fi
                            
                            echo '✅ Frontend built successfully'
                            
                            cd ''' + env.PROJECT_DIR + '''
                            docker compose build --no-cache frontend
                            docker compose down
                            docker compose up -d
                            
                            sleep 20
                            
                            echo '✅ Deployment complete!'
                            echo 'Frontend: https://campushostels.duckdns.org/'
                        "
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Success! Frontend built and deployed."
        }
        failure {
            echo "❌ Failed"
        }
    }
}