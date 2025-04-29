import admin from "firebase-admin"

const sendNotification= async(title,body,interactedPostCover,token)=>{

    //creating the message
    const message={
        notification: {
            title: title,
            body: body
          },
          android: {
            notification: {
              imageUrl: interactedPostCover
            }
          },
        data:{
            title:title,
            body:body
        },
        token:token
    }

    await admin.messaging().send(message)

}

export default sendNotification