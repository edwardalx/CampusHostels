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
                                
                                # Reset any local changes first
                                git reset --hard HEAD
                                git clean -fd -e portainer-data -e ssl -e certbot || true
                                
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
                                
                                # Check if volume exists as root first
                                VOLUME_PATH="/var/lib/docker/volumes/campushostels_frontend-static/_data"
                                echo "📦 Looking for volume at: \$VOLUME_PATH"
                                
                                # Try to check with sudo
                                if sudo [ ! -d "\$VOLUME_PATH" ]; then
                                    echo "⚠️ Volume path not found directly, checking Docker volumes..."
                                    # List volumes to see what exists
                                    docker volume ls | grep -i frontend
                                    
                                    # Try alternative volume names
                                    VOLUME_NAMES=(
                                        "campushostels_frontend-static"
                                        "frontend-static"
                                    )
                                    
                                    for VOLUME_NAME in "\${VOLUME_NAMES[@]}"; do
                                        echo "Checking volume: \$VOLUME_NAME"
                                        VOLUME_INFO=\$(docker volume inspect "\$VOLUME_NAME" 2>/dev/null | grep "Mountpoint" | cut -d'"' -f4)
                                        if [ ! -z "\$VOLUME_INFO" ]; then
                                            VOLUME_PATH="\$VOLUME_INFO"
                                            echo "✅ Found volume mountpoint: \$VOLUME_PATH"
                                            break
                                        fi
                                    done
                                    
                                    if [ -z "\$VOLUME_PATH" ] || sudo [ ! -d "\$VOLUME_PATH" ]; then
                                        echo "❌ No volume found, trying direct Docker copy method..."
                                        # Alternative: Use docker cp directly
                                        docker cp dist/. campushostels_nginx:/var/www/campushostels-fe/ 2>/dev/null || echo "Docker cp failed, trying restart approach"
                                        
                                        # If docker cp fails due to read-only, rebuild container
                                        cd ${env.PROJECT_DIR}
                                        echo "Rebuilding nginx container to pick up new files..."
                                        docker compose up -d --force-recreate nginx
                                        
                                        echo "✅ Using container rebuild method"
                                        echo "🌐 Check: https://campushostels.duckdns.org/"
                                        echo "💡 Clear browser cache: Ctrl+Shift+R"
                                        exit 0
                                    fi
                                fi
                                
                                echo "📦 Copying to volume: \$VOLUME_PATH"
                                
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
                                docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null || echo "Cannot check nginx container"
                                
                                # Restart nginx to pick up changes
                                echo "🔄 Restarting nginx..."
                                cd ${env.PROJECT_DIR}
                                docker compose restart nginx
                                
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