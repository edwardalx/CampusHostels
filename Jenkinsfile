pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        CONTAINER_NAME = "campushostels-backend-admin-container"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Checkout Repository') {
            steps {
                echo "Checking out repository..."
                // Make sure Jenkins workspace is correct
                dir("${env.REPO_DIR}") {
                    checkout scm
                }
            }
        }

        stage('Build Backend Admin Docker Image') {
            steps {
                script {
                    echo "Building Backend Admin Docker image..."
                    sh "docker build -t ${env.BACKEND_ADMIN_IMAGE} ${env.REPO_DIR}/backend-admin"
                }
            }
        }

        stage('Run Backend Admin Tests') {
            steps {
                script {
                    echo "Running Django tests..."
                    sh "docker run --rm ${env.BACKEND_ADMIN_IMAGE} python manage.py test"
                }
            }
        }
        stage('Deploy Backend Admin Container') {
            steps {
                script {
                    def containerName = "campushostels-backend-admin-container"

                    // Stop and remove old container if exists
                    sh """
                        if [ \$(docker ps -aq -f name=${containerName}) ]; then
                            docker rm -f ${containerName}
                        fi
                    """

                    // Run new container, optionally on a different port
                    sh "docker run -d --name ${containerName} -p 8080:8000 ${env.BACKEND_ADMIN_IMAGE}"
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
