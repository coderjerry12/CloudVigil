#!/bin/bash
# Deploy frontend to S3 + CloudFront
# Usage: ./deploy.sh

set -e

echo "📦 Building frontend..."
npm run build

# Get stack outputs
STACK_NAME="eventshield-ai-backend-dev"
echo "🔍 Fetching deployment info from CloudFormation..."

BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

if [ -z "$BUCKET" ] || [ "$BUCKET" = "None" ]; then
  echo "❌ Could not find FrontendBucketName in stack outputs. Deploy backend first."
  exit 1
fi

echo "📤 Uploading to S3: $BUCKET"
aws s3 sync dist/ s3://$BUCKET --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null

echo ""
echo "✅ Frontend deployed successfully!"
echo "🌐 URL: $CLOUDFRONT_URL"
echo ""
echo "Note: CloudFront cache invalidation may take 1-2 minutes to propagate."
