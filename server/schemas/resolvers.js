const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, { username, email, password }, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookToSave }, context) => {
      if (context.user) {
        const updatedBooks = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookToSave } },
          { new: true }
        ).populate('savedBooks');

        return updatedBooks;
      }
    },  
    removeBook: async (parent, { bookId }, context) => {
        if (context.user) {
          const updatedBooks = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId } } },
            { new: true }
          );
  
          return updatedBooks;
        }
    }
  },
};

module.exports = resolvers;
