pipeline {
    agent any

    environment {
        SERVER_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels/backend-admin"
        VENV_PATH = "/home/eobkwaku/venv"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/edwardalx/CampusHostels.git'
            }
        }

        stage('Deploy to Production') {
            steps {
                sh """
                    echo "🚀 DEPLOYING TO ACTUAL PRODUCTION SYSTEM..."
                    
                    # Copy code from Jenkins workspace to production directory
                    echo "📦 Copying code to production..."
                    rsync -av --delete ./backend-admin/ ${env.SERVER_DIR}/
                    
                    # Fix permissions
                    chown -R eobkwaku:eobkwaku ${env.SERVER_DIR}
                    
                    echo "📦 Installing dependencies..."
                    sudo -u eobkwaku bash -c '
                        source ${env.VENV_PATH}/bin/activate
                        cd ${env.SERVER_DIR}
                        pip install -r requirements.txt
                    '
                    
                    echo "🗄️ Running database migrations..."
                    sudo -u eobkwaku bash -c '
                        source ${env.VENV_PATH}/bin/activate
                        cd ${env.SERVER_DIR}
                        python manage.py migrate
                    '
                    
                    echo "📁 Collecting static files..."
                    sudo -u eobkwaku bash -c '
                        source ${env.VENV_PATH}/bin/activate
                        cd ${env.SERVER_DIR}
                        python manage.py collectstatic --noinput
                    '
                    
                    echo "🔄 Restarting production services..."
                    sudo systemctl restart gunicorn
                    sudo systemctl reload nginx
                    
                    echo "✅ SUCCESS! Code deployed to ACTUAL PRODUCTION!"
                """
            }
        }

        stage('Verify Production Deployment') {
            steps {
                sh """
                    echo "=== PRODUCTION VERIFICATION ==="
                    echo ""
                    echo "📊 Gunicorn Status:"
                    sudo systemctl status gunicorn --no-pager | head -5
                    echo ""
                    echo "🌐 Testing Production Site:"
                    curl -s -o /dev/null -w "HTTP Status: %{http_code}\\n" http://localhost/admin
                    echo ""
                    echo "📝 Recent Application Logs:"
                    sudo journalctl -u gunicorn -n 5 --no-pager
                    echo ""
                    echo "🎯 PRODUCTION URL: http://hostels.bookshelfgh.duckdns.org/admin"
                    echo "✅ Code changes are now LIVE for all users!"
                """
            }
        }
    }

    post {
        success {
            echo "🎉 SUCCESS! PRODUCTION DEPLOYMENT COMPLETE!"
            echo "👀 Users can now see changes at: http://hostels.bookshelfgh.duckdns.org"
            echo "🔧 Admin panel: http://hostels.bookshelfgh.duckdns.org/admin"
        }
        failure {
            echo "❌ Production deployment failed"
            sh """
                echo "=== TROUBLESHOOTING INFO ==="
                sudo journalctl -u gunicorn -n 20 --no-pager
                echo "=== NGINX STATUS ==="
                sudo systemctl status nginx --no-pager
            """
        }
    }
}