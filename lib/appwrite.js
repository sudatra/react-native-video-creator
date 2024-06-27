import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.sudatra.aora',
  projectId: '666065c60014a4296bf5',
  databaseId: '6660673f000d82a06fc6',
  userCollectionId: '6660677800373a511812',
  videoCollectionId: '666067a400380a90efd3',
  storageId: '66606bd6001b4a389f52'
};


const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform) 
;


const account = new Account(client);
const databases = new Databases(client);
const avatars = new Avatars(client);
const storage = new Storage(client);

// create user or sign up
export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if(!newAccount) {
      throw new Error;
    }

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);
    
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl
      }
    );

    return newUser;
  }
  catch(error) {
    console.log(error);
    throw new Error(error);
  }
};

// sign in
export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    return session;
  }
  catch(error) {
    throw new Error(error);
  }
};

// get current logged in account
export const getAccount = async () => {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  }
  catch(error) {
    throw new Error(error);
  }
};

// get current logged in user
export const getCurrentUser = async () => {
  try {
    const currentAccount = await getAccount();

    if(!currentAccount) {
      throw Error;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    );

    if(!currentUser) {
      throw Error;
    }

    return currentUser.documents[0];
  }
  catch(error) {
    console.log(error);
  }
};

// get all posts
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc('$createdAt')]
    );

    return posts.documents;
  }
  catch(error) {
    throw new Error;
  }
};

// get the latest posts
export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc('$createdAt', Query.limit(7))]
    );

    return posts.documents;
  }
  catch(error) {
    throw new Error;
  }
};

// search for a particular post
export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search('title', query)]
    );

    return posts.documents;
  }
  catch(error) {
    throw new Error;
  }
};

// get all posts by a particular user
export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [
        Query.equal('users', userId),
        Query.orderDesc('$createdAt')
      ]
    );

    return posts.documents;
  }
  catch(error) {
    throw new Error;
  }
};

// sign out
export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');
    return session;
  }
  catch(error) {
    throw new Error(error);
  }
};

// get file preview
export const getFilePreview = async (fileId, type) => {
  let fileUrl;

  try {
    if(type === 'video') {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    }
    else if(type === 'image') {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        'top',
        100
      );
    }
    else {
      throw new Error('Invalid file type');
    }

    if(!fileUrl) {
      throw Error;
    }

    return fileUrl;
  }
  catch(error) {
    throw new Error(error);
  }
};

//upload a file
export const uploadFile = async (file, type) => {
  if(!file) {
    return;
  }

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri
  };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  }
  catch(error) {
    throw new Error(error);
  }
};

// upload video
export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video')
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        users: form.userId
      }
    );

    return newPost;
  }
  catch(error) {
    throw new Error(error);
  }
};

