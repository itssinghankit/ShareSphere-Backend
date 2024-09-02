# ShareSphere Backend

ShareSphere is a robust backend for a social media application, built with Node.js and following the MVC (Model-View-Controller) architecture. This README provides an overview of the project, its features, and instructions for setting up and running the application.

## Features

- User Authentication (Signup, Signin, OTP verification)
- User Profile Management
- Post Creation and Management
- Social Interactions (Like, Follow)
- Image Upload and Storage
- Pagination
- Error Handling

## Technologies Used

- Node.js
- Express.js
- MongoDB (Database)
- JSON Web Token (Authentication)
- Cloudinary (Image storage)
- Multer (File upload handling)
- Nodemailer (Email services)
- Twilio (OTP services)
- Cors (Cross-Origin Resource Sharing)

## Dependencies

- express
- mongoose
- jsonwebtoken
- bcryptjs
- cloudinary
- multer
- cors
- nodemailer
- twilio
- http-errors

## Routes

The application includes the following main routes:

### Authentication
- Signup
- Signin
- Send OTP
- Verify OTP

### User Management
- Save user details
- Update user details
- Update avatar

### Post Management
- Create post
- Show all posts
- Show user's posts
- Save post
- Like post

### Social Interactions
- Show followers
- Show following
- Follow user

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sharesphere-backend.git
   ```

2. Navigate to the project directory:
   ```
   cd sharesphere-backend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add the following environment variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

5. Start the server:
   ```
   npm start
   ```

## API Documentation

For detailed API documentation, please refer to the [API_DOCS.md](API_DOCS.md) file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.