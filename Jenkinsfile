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
                                
                                # Update code
                                git pull origin main
                                
                                echo "🔨 Building frontend..."
                                cd frontend/campushostel-fe
                                
                                # Build frontend
                                rm -rf node_modules package-lock.json 2>/dev/null || true
                                npm install --force --legacy-peer-deps
                                npm run build
                                
                                if [ ! -f "dist/index.html" ]; then
                                    echo "❌ Frontend build failed!"
                                    exit 1
                                fi
                                
                                echo "✅ Frontend built successfully"
                                echo "Build timestamp:"
                                ls -la dist/index.html
                                
                                # THE FIX: Copy to the correct volume
                                VOLUME_PATH="/var/lib/docker/volumes/campushostels_frontend-static/_data"
                                echo "📦 Copying to volume: \$VOLUME_PATH"
                                
                                # Check if volume exists
                                if [ ! -d "\$VOLUME_PATH" ]; then
                                    echo "❌ Volume path not found: \$VOLUME_PATH"
                                    exit 1
                                fi
                                
                                # Remove old files and copy new ones
                                sudo rm -rf "\$VOLUME_PATH"/*
                                sudo cp -r dist/* "\$VOLUME_PATH"/
                                
                                # Fix permissions (nginx runs as user 101 in container)
                                sudo chown -R 101:101 "\$VOLUME_PATH" 2>/dev/null || true
                                sudo chmod -R 755 "\$VOLUME_PATH" 2>/dev/null || true
                                
                                echo "✅ Files copied to volume"
                                echo "Volume contents after copy:"
                                sudo ls -la "\$VOLUME_PATH"/
                                
                                # Verify files in nginx container
                                echo "🔍 Verifying in nginx container..."
                                docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ || echo "Cannot check nginx container"
                                
                                # Force nginx to reload
                                echo "🔄 Reloading nginx..."
                                docker compose restart nginx
                                sleep 2
                                docker exec campushostels_nginx nginx -s reload 2>/dev/null || true
                                
                                echo "✅ Frontend deployment completed!"
                                echo "🌐 Check: https://campushostels.duckdns.org/"
                                echo "💡 Clear browser cache: Ctrl+Shift+R"
                            '
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Frontend deployed successfully!"
        }
        failure {
            echo "❌ Frontend deployment failed!"
        }
    }
}