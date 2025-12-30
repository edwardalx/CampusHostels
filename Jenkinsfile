pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Build and Deploy Frontend') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                                echo "=== Frontend Deployment at \$(date) ==="
                                
                                cd ${env.PROJECT_DIR}
                                
                                # Reset and update
                                git reset --hard HEAD
                                git pull origin main
                                
                                echo "🔨 Building frontend..."
                                cd frontend/campushostel-fe
                                
                                # Build
                                rm -rf node_modules package-lock.json 2>/dev/null || true
                                npm install --force --legacy-peer-deps
                                npm run build
                                
                                if [ ! -f "dist/index.html" ]; then
                                    echo "❌ Frontend build failed!"
                                    exit 1
                                fi
                                
                                echo "✅ Frontend built successfully"
                                
                                # IMPROVED: Don\'t stop nginx, use temporary container
                                echo "📦 Deploying files..."
                                
                                # Create temporary container with volume
                                docker run -d --name temp_frontend_deploy \\
                                    -v campushostels_frontend-static:/target \\
                                    busybox tail -f /dev/null
                                
                                # Copy files
                                docker cp dist/. temp_frontend_deploy:/target/
                                
                                # Clean up
                                docker stop temp_frontend_deploy
                                docker rm temp_frontend_deploy
                                
                                # Just reload nginx to pick up new files (no restart needed)
                                echo "🔄 Reloading nginx..."
                                docker exec campushostels_nginx nginx -s reload 2>/dev/null || true
                                
                                echo "✅ Frontend deployment completed with zero downtime!"
                                echo "🌐 Check: https://campushostels.duckdns.org/"
                            '
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Frontend deployed successfully with zero downtime!"
        }
        failure {
            echo "❌ Frontend deployment failed!"
        }
    }
}