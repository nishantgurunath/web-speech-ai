module "static_module" {
  source = "./static/"
}

variable "container_name" {
  description = "Name of the ECS docker container"
  type        = string
  default     = "conversation_bot_container_tf"
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
  default     = "conversation_bot_service_tf"
}

resource "aws_ecs_task_definition" "ecs_task_definition" {
  family                   = "conversation_bot_tf"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  task_role_arn            = "arn:aws:iam::223658162111:role/ecsTaskExecutionRole"
  execution_role_arn       = "arn:aws:iam::223658162111:role/ecsTaskExecutionRole"
  cpu                      = 1024
  memory                   = 2048
  
  container_definitions    = jsonencode(
  [
    {
      "name": "${var.container_name}",
      "image": "${module.static_module.ecr_repository_url}:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        },
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "memoryReservation": 32,
      "cpu": 1,
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-task",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "OPEN_API_KEY",
          "value": "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"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ]
    }
  ]
  )
}

resource "aws_ecs_service" "ecs_service" {
  name            = var.ecs_service_name
  cluster         = module.static_module.ecs_cluster_id
  task_definition = aws_ecs_task_definition.ecs_task_definition.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups = [module.static_module.ecs_load_balancer_sg_id]
    subnets         = module.static_module.ecs_subnet_ids
  }

  load_balancer {
    target_group_arn = module.static_module.ecs_target_group_arn
    container_name   = var.container_name
    container_port   = 8080
  }
}
