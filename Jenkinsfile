pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Deploy Everything') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    script {
                        def sshCommand = """
                            set -e
                            echo '=== Full Deployment at \$(date) ==='
                            
                            cd ${env.PROJECT_DIR}
                            
                            # Pull latest code
                            git stash || true
                            git pull origin main
                            
                            # Build frontend
                            echo '🔨 Building frontend...'
                            cd frontend/campushostel-fe
                            rm -rf node_modules package-lock.json 2>/dev/null || true
                            npm install --no-optional --legacy-peer-deps
                            npm run build
                            
                            if [ ! -f 'dist/index.html' ]; then
                                echo '❌ Frontend build failed!'
                                exit 1
                            fi
                            
                            echo '✅ Frontend built successfully'
                            
                            # Deploy with Docker
                            cd ${env.PROJECT_DIR}
                            echo '🚀 Deploying with Docker Compose...'
                            docker compose build --no-cache frontend
                            docker compose build
                            docker compose down
                            docker compose up -d
                            
                            sleep 30
                            
                            # Run Django commands
                            docker compose exec -T web python manage.py migrate --noinput || true
                            docker compose exec -T web python manage.py collectstatic --noinput --clear || true
                            
                            echo '✅ Deployment completed at \$(date)'
                            echo 'Frontend: https://campushostels.duckdns.org/'
                        """
                        
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '${sshCommand.replace("'", "'\"'\"'")}'
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}