pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/mohsinbehzad/todo_devops.git'
            }
        }

        stage('Deploy Part 2') {
            steps {
                sh '''
                    cd /var/lib/jenkins/todo-devops-p2
                    docker-compose -f docker-compose.part2.yml down
                    docker-compose -f docker-compose.part2.yml up -d
                    docker ps --filter "name=todo"
                '''
            }
        }
    }

    post {
        success { echo '✅ Deployed on port 8081!' }
        failure { echo '❌ Failed. Check logs.' }
    }
}
