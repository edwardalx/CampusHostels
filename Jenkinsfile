pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        BACKEND_API_IMAGE   = "campushostels-backend-api"
        FRONTEND_IMAGE      = "campushostels-frontend"
    }

    stages {
        stage('Checkout Repository') {
            steps {
                echo "Checking out repository..."
                checkout scm
            }
        }

        stage('Build Backend Admin Docker Image') {
            steps {
                script {
                    echo "Building Backend Admin Docker image..."
                    sh "docker build -t ${env.BACKEND_ADMIN_IMAGE} ./backend-admin"
                }
            }
        }

        stage('Build Backend API Docker Image') {
            steps {
                script {
                    echo "Building Backend API Docker image..."
                    sh "docker build -t ${env.BACKEND_API_IMAGE} ./backend-api"
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                script {
                    echo "Building Frontend Docker image..."
                    sh "docker build -t ${env.FRONTEND_IMAGE} ./frontend"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo "Add your test commands here, e.g., Django tests, React tests"
                    // Example: sh "docker run --rm ${env.BACKEND_ADMIN_IMAGE} python manage.py test"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploy stage: push images or deploy containers"
                    // Example: sh "docker-compose up -d"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for errors."
        }
    }
}
