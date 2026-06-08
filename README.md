# Smart Complaint & Issue Resolution Platform

A full-stack serverless application built on AWS for managing 
complaints in colleges, apartments, and offices.

## Tech Stack
- Frontend: Next.js + TypeScript (deployed on AWS Amplify)
- Backend: AWS Lambda + API Gateway
- Database: AWS DynamoDB
- Auth: AWS Cognito (Role-based: ADMIN / USER)
- Storage: AWS S3
- Infrastructure: AWS CDK (TypeScript)

## Features
- Role-based login (Admin sees all, Student sees own)
- Create, update, delete complaints
- Activity timeline for every complaint
- S3 image uploads
- Bulk delete for admins
- CI/CD via GitHub + Amplify
