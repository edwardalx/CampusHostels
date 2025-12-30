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
                                
                                # Use sudo for Docker commands since Jenkins user isn't in docker group
                                echo "📦 Deploying files..."
                                
                                # Method 1: Direct copy to volume (no Docker commands needed)
                                VOLUME_PATH="/var/lib/docker/volumes/campushostels_frontend-static/_data"
                                
                                if [ -d "\$VOLUME_PATH" ]; then
                                    echo "📦 Copying directly to volume..."
                                    
                                    # Remove ALL old files
                                    sudo rm -rf "\$VOLUME_PATH"/*
                                    
                                    # Copy ALL new files
                                    sudo cp -r dist/* "\$VOLUME_PATH"/
                                    
                                    # Fix permissions for nginx (user 101 in container)
                                    sudo chown -R 101:101 "\$VOLUME_PATH" 2>/dev/null || true
                                    sudo chmod -R 755 "\$VOLUME_PATH" 2>/dev/null || true
                                    
                                    echo "✅ Direct copy completed"
                                else
                                    echo "❌ Volume path not found!"
                                    exit 1
                                fi
                                
                                # Verify the copy
                                echo "🔍 Verifying files..."
                                echo "Index.html timestamp:"
                                sudo ls -la "\$VOLUME_PATH/index.html"
                                echo "Assets directory:"
                                sudo ls -la "\$VOLUME_PATH/assets/" | head -10
                                
                                # Reload nginx (using sudo since docker commands need it)
                                echo "🔄 Reloading nginx..."
                                sudo docker exec campushostels_nginx nginx -s reload 2>/dev/null || true
                                
                                echo "✅ Frontend deployment completed!"
                                echo "🌐 Check: https://campushostels.duckdns.org/"
                                echo "💡 Clear browser cache: Ctrl+Shift+R (important for JS/CSS changes)"
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