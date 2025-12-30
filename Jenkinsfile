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
                            echo '=== Full Deployment at $(date) ==='
                            cd ''' + env.PROJECT_DIR + '''
                            
                            # Clean git state
                            git stash || true
                            git pull origin main
                            
                            echo '🔨 Building frontend...'
                            cd frontend/campushostel-fe
                            
                            # Build with retry logic
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
                            
                            # Verify build
                            if [ ! -f 'dist/index.html' ]; then
                                echo '❌ Build verification failed'
                                exit 1
                            fi
                            
                            echo '✅ Frontend built successfully'
                            echo 'Build size: $(du -sh dist/)'
                            
                            # CRITICAL: Copy build files directly to nginx directory
                            echo '📦 Copying frontend files to nginx volume...'
                            sudo mkdir -p /var/www/campushostels-fe
                            sudo cp -r dist/* /var/www/campushostels-fe/
                            sudo chown -R www-data:www-data /var/www/campushostels-fe
                            sudo chmod -R 755 /var/www/campushostels-fe
                            
                            # Now deploy with Docker
                            cd ''' + env.PROJECT_DIR + '''
                            echo '🚀 Deploying with Docker Compose...'
                            
                            # Rebuild frontend image with the new build
                            docker compose build --no-cache frontend
                            
                            # Restart services
                            docker compose down
                            docker compose up -d
                            
                            sleep 30
                            
                            # Run Django commands
                            docker compose exec -T web python manage.py migrate --noinput || echo '⚠️ Migrations warning'
                            docker compose exec -T web python manage.py collectstatic --noinput --clear || echo '⚠️ Static collection warning'
                            
                            echo '✅ Deployment completed at $(date)'
                            echo ''
                            echo '=== Verification ==='
                            docker compose ps
                            echo ''
                            echo 'Frontend files in nginx:'
                            docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null || echo 'Checking nginx files...'
                            echo ''
                            echo '=== URLs ==='
                            echo '🌐 Frontend: https://campushostels.duckdns.org/'
                            echo '🔧 Django Admin: https://campushostels.duckdns.org/admin/'
                            echo '💡 Tip: Clear browser cache (Ctrl+Shift+R) to see changes'
                        "
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Full stack deployment successful!"
            echo "📢 Clear browser cache: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}