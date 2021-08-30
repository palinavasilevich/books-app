const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectID;
const crypto = require("crypto");

const Book = require("../models/Book");

const Author = require("../models/Author");
const Genre = require("../models/Genre");
const BookInstance = require("../models/bookinstance");
const Review = require("../models/Review");

const BookActions = require("../models/BookActions");

class bookController {
  ///BGN CREATE///
  async createAuthor(req, res) {
    try {
      const { first_name, last_name } = req.body;
      const authorBook = await Author.findOne({
        first_name,
        last_name,
      });

      if (authorBook) {
        return res
          .status(400)
          .json({ message: "This author has already been created" });
      }

      const author = new Author({ first_name, last_name });
      await author.save();
      return res.json({ message: "Author has created" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create author error" });
    }
  }

  async createGenre(req, res) {
    try {
      const { name } = req.body;
      const genreBook = await Genre.findOne({
        name,
      });
      if (genreBook) {
        return res
          .status(400)
          .json({ message: "This genre has already been created" });
      }

      const genre = new Genre({ name });
      await genre.save();
      return res.json({ message: "Genre has created" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create genre error" });
    }
  }

  async createBook(req, res) {
    try {
      const { title, img, author, genre, count } = req.body;

      const bookOne = await Book.findOne({
        title,
      });

      if (bookOne) {
        return res
          .status(400)
          .json({ message: "This book has already been created" });
      }

      const book = new Book({
        title,
        img,
        count,
        author: author._id,
        genre: [genre._id],
      });

      await book.save();
      return res.json({ message: "Book has created" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Create book error" });
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  async reserveBook(req, res) {
    try {
      const { user, book } = req.body;

      if (!book.count) {
        return res.status(400).send({ message: "The book is out of stock. " });
      }

      // const reservedBook = await BookActions.findOne({
      //   user: user._id,
      //   book: book._id,
      // });

      // if (reservedBook && reservedBook.status === "Reserved") {
      //   return res
      //     .status(400)
      //     .send({ message: "You have already reserved this book" });
      // }

      const reservation_number = crypto.randomBytes(8).toString("hex");

      const bookAction = new BookActions({
        book,
        user,
        userAction: user,
        reservation_number,
        status: "Reserved",
        action_date: Date.now(),
      });

      await Book.findOneAndUpdate(
        { _id: book._id },
        {
          $set: {
            count: book.count - 1,
          },
        },

        { new: true, useFindAndModify: false }
      );

      await bookAction.save();

      return res.json({
        message: `${bookAction.book.title} has reserved successfully!`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot reserved book` });
    }
  }

  async giveOutBook(req, res) {
    try {
      const { user, book, userAction, return_date, reservation_number } =
        req.body;
      const bookAction = new BookActions({
        book,
        user,
        userAction,
        return_date,
        reservation_number,
        status: "Received",
        action_date: Date.now(),
      });

      await bookAction.save();

      return res.json({
        message: `${bookAction.book.title} has received successfully!`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot receive book` });
    }
  }

  async returnBook(req, res) {
    try {
      const { user, book, userAction } = req.body;

      const bookAction = new BookActions({
        book: book,
        user: user,
        userAction: userAction,
        status: "Returned",
        isActual: false,
        action_date: Date.now(),
      });

      await BookActions.updateMany(
        { book: book._id, user: user._id, isActual: true },
        {
          $set: { isActual: false },
          $currentDate: { lastModified: true },
        }
      );

      await Book.findOneAndUpdate(
        { _id: book._id },
        {
          $set: {
            count: book.count + 1,
          },
        },

        { new: true, useFindAndModify: false }
      );

      await bookAction.save();

      return res.json({
        message: `${bookAction.book.title} has returned successfully!`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot return book` });
    }
  }

  async cancelBook(req, res) {
    try {
      const { user, book, userAction } = req.body;

      const bookAction = new BookActions({
        book,
        user,
        userAction: userAction,
        status: "Canceled",
        isActual: false,
        action_date: Date.now(),
      });

      await BookActions.updateMany(
        { book: book._id, user: user._id, isActual: true },
        {
          $set: { isActual: false },
          $currentDate: { lastModified: true },
        }
      );

      await Book.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(book._id) },
        {
          $set: {
            count: book.count + 1,
          },
        },

        { new: true, useFindAndModify: false }
      );

      await bookAction.save();

      return res.json({
        message: `${bookAction.book.title} has received successfully!`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot receive book` });
    }
  }

  async createReview(req, res) {
    try {
      const { book, user, text, rating } = req.body;

      const review = new Review({
        text,
        book: book._id,
        user: user._id,
        rating,
      });

      await review.save();

      const data = await Review.aggregate([
        {
          $match: {
            book: new mongoose.Types.ObjectId(book._id),
            rating: { $gte: 1 },
          },
        },

        {
          $group: {
            _id: "$book",
            ratingAvg: { $avg: "$rating" },
          },
        },

        {
          $project: {
            _id: 0,
            ratingAvg: { $ceil: "$ratingAvg" },
          },
        },
      ]);

      await Book.findByIdAndUpdate(
        { _id: book._id },
        {
          $set: {
            rating: data[0].ratingAvg,
          },
        },
        { new: true, useFindAndModify: false }
      );

      return res.json({
        message: `Review has created successfully!`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Create review error" });
    }
  }

  ///END CREATE///

  ///BGN GET///
  async getBooks(req, res) {
    try {
      const books = await Book.find().populate("author").populate("genre");
      res.json(books);
    } catch (e) {
      console.log(e);
    }
  }

  async getMostPopularBooks(req, res) {
    try {
      const mostPopularBooks = await BookActions.aggregate([
        { $match: { status: "Returned" } },

        {
          $group: {
            _id: "$book",
            book: { $first: "$book" },
            count: { $sum: 1 },
          },
        },

        {
          $lookup: {
            from: "books",
            let: { bookObjId: { $toObjectId: "$book" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$bookObjId"] } } }],
            as: "book",
          },
        },

        { $unwind: "$book" },

        {
          $lookup: {
            from: "authors",
            localField: "book.author",
            foreignField: "_id",
            as: "book.author",
          },
        },

        { $unwind: "$book.author" },

        {
          $match: {
            count: { $gte: 2 },
          },
        },

        {
          $group: {
            _id: null,
            entries: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            count: 0,
            titles: {
              $map: {
                input: "$entries",
                as: "grade",
                in: "$$grade",
              },
            },
          },
        },
      ]);

      res.json(mostPopularBooks);
    } catch (error) {
      console.log(error);
    }
  }

  async getTopBooks(req, res) {
    try {
      const mostPopularBooks = await BookActions.aggregate([
        { $match: { status: "Returned" } },

        {
          $group: {
            _id: "$book",
            book: { $first: "$book" },
            count: { $sum: 1 },
          },
        },

        {
          $lookup: {
            from: "books",
            let: { bookObjId: { $toObjectId: "$book" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$bookObjId"] } } }],
            as: "book",
          },
        },

        { $unwind: "$book" },

        {
          $lookup: {
            from: "authors",
            localField: "book.author",
            foreignField: "_id",
            as: "book.author",
          },
        },

        { $unwind: "$book.author" },

        {
          $match: {
            count: { $gte: 2 },
          },
        },
        {
          $project: {
            _id: 0,
            count: 0,
          },
        },
      ]);

      res.json(mostPopularBooks);
    } catch (error) {
      console.log(error);
    }
  }

  async getAuthors(req, res) {
    try {
      const authors = await Author.find();
      res.json(authors);
    } catch (e) {
      console.log(e);
    }
  }

  async getGenres(req, res) {
    try {
      const genres = await Genre.find();
      res.json(genres);
    } catch (e) {
      console.log(e);
    }
  }

  async getUserReservedBooks(req, res) {
    const { id } = req.params;
    try {
      const reservedBooks = await BookActions.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(id),
            isActual: true,
          },
        },

        { $sort: { action_date: 1 } },

        {
          $group: {
            _id: "$book",
            book: { $first: "$book" },
            user: { $first: "$user" },
            last_action: { $last: "$action_date" },
            reservation_number: { $first: "$reservation_number" },
            details: {
              $push: {
                status: "$status",
                action_date: "$action_date",
                isActual: "$isActual",
                return_date: "$return_date",
              },
            },
          },
        },

        {
          $lookup: {
            from: "books",
            let: { bookObjId: { $toObjectId: "$book" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$bookObjId"] } } }],
            as: "book",
          },
        },

        { $unwind: "$book" },

        {
          $lookup: {
            from: "authors",
            localField: "book.author",
            foreignField: "_id",
            as: "book.author",
          },
        },

        { $unwind: "$book.author" },

        {
          $lookup: {
            from: "genres",
            localField: "book.genre",
            foreignField: "_id",
            as: "book.genre",
          },
        },

        { $unwind: "$book.genre" },

        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },

        { $unwind: "$user" },

        { $sort: { last_action: -1 } },
      ]);

      res.json(reservedBooks);
    } catch (e) {
      console.log(e);
    }
  }

  async getAllBookActions(req, res) {
    try {
      const bookActions = await BookActions.find()
        .populate("user")
        .populate("userAction")
        .populate({ path: "book", populate: ["author", "genre"] });

      res.json(bookActions);
    } catch (error) {
      console.log(error);
    }
  }

  async getReservedBooks(req, res) {
    try {
      const reservedBooks = await BookActions.aggregate([
        {
          $match: {
            isActual: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },

        { $unwind: "$user" },

        {
          $lookup: {
            from: "books",
            localField: "book",
            foreignField: "_id",
            as: "book",
          },
        },

        { $unwind: "$book" },

        { $sort: { action_date: -1 } },
        {
          $group: {
            _id: { user: "$user", book: "$book" },
            last_action: { $first: "$action_date" },
            data: {
              $push: {
                status: "$status",
                action_date: "$action_date",
                userAction: "$userAction",
                reservation_number: "$reservation_number",
                return_date: "$return_date",
              },
            },
          },
        },
        { $sort: { last_action: -1 } },
      ]);

      res.json(reservedBooks);
    } catch (e) {
      console.log(e);
    }
  }

  async getModifiedReservedBooks(req, res) {
    try {
      const reservedBooks = await BookActions.aggregate([
        {
          $match: {
            isActual: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },

        { $unwind: "$user" },

        {
          $lookup: {
            from: "books",
            localField: "book",
            foreignField: "_id",
            as: "book",
          },
        },

        { $unwind: "$book" },

        { $sort: { action_date: -1 } },

        {
          $set: {
            data: "$$ROOT",
          },
        },

        {
          $group: {
            _id: { user: "$user", book: "$book" },
            last_action: { $first: "$action_date" },
            items: { $push: "$$ROOT" },
          },
        },

        { $sort: { last_action: -1 } },

        {
          $addFields: {
            data: { $arrayElemAt: ["$items", 0] },
            children: { $slice: ["$items", -1] },
          },
        },

        {
          $set: {
            "data.key": "$data._id",
            key: "$data._id",
          },
        },

        {
          $project: {
            _id: 0,
            data: 1,
            key: 1,
            "children.key": "$data._id",
            "children.data": 1,
          },
        },
      ]);

      res.json(reservedBooks);
    } catch (e) {
      console.log(e);
    }
  }

  async getReviews(req, res) {
    try {
      const reviews = await Review.find()
        .populate("user")
        .populate({ path: "book", populate: ["author", "genre"] });
      res.json(reviews);
    } catch (error) {
      console.log(error);
    }
  }

  async getReviewsBook(req, res) {
    const { id } = req.params;
    try {
      const reviews = await Review.find({ book: id })
        .populate("user")
        .populate({ path: "book", populate: ["author", "genre"] });

      res.json(reviews);
    } catch (error) {
      console.log(error);
    }
  }

  ///END GET///

  ///BGN UPDATE///
  async updateBook(req, res) {
    const { id } = req.params;
    try {
      const { author, genre } = req.body;

      await Book.findOneAndUpdate(
        { _id: id },
        { ...req.body, author: author._id, genre: [genre._id] },
        { new: true, useFindAndModify: false }
      );
      res.json({
        message: "Book was updated successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot update book with id: ${id}` });
    }
  }

  async updateAuthor(req, res) {
    const { id } = req.params;
    try {
      await Author.findOneAndUpdate({ _id: id }, req.body, { new: true });
      res.json({
        message: "Author was updated successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot update author with id: ${id}` });
    }
  }

  async updateGenre(req, res) {
    const { id } = req.params;
    try {
      await Genre.findOneAndUpdate({ _id: id }, req.body, { new: true });
      res.json({
        message: "Genre was updated successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: `Cannot update genre with id: ${id}` });
    }
  }

  async updateReservedBook(req, res) {
    const { id } = req.params;
    try {
      const { book, return_date } = req.body;

      await BookInstance.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            return_date,
            status: "Available",
          },
        },
        { new: true, useFindAndModify: false }
      );

      await Book.findByIdAndUpdate(
        { _id: book._id },
        {
          $set: {
            count: book.count + 1,
          },
        },
        { new: true, useFindAndModify: false }
      );

      res.json({
        message: "Reserved book was updated successfully",
      });
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .json({ message: `Cannot update reserved book with id: ${id}` });
    }
  }

  async updateReview(req, res) {
    const { id } = req.params;
    try {
      const { user, book } = req.body;

      await Review.findOneAndUpdate(
        { _id: id },
        {
          ...req.body,
          user: user._id,
          book: [book._id],
          edit_date: Date.now(),
        },
        { new: true, useFindAndModify: false }
      );

      res.json({
        message: "Review book was updated successfully",
      });
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .json({ message: `Cannot update review book with id: ${id}` });
    }
  }

  ///END UPDATE///

  ///BGN DELETE///
  async deleteBook(req, res) {
    const { id } = req.params;
    try {
      const bookAction = await BookActions.findOne({ book: id });
      const review = await Review.findOne({ book: id });

      if (!bookAction && !review) {
        const book = await Book.findByIdAndDelete({ _id: id });
        return res.json({
          message: `${book.title} were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Book can't be deleted. This entry is linked to other schemes!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete book with id ${id}` });
    }
  }

  async deleteManyBooks(req, res) {
    try {
      const { ids } = req.body;
      const bookAction = await BookActions.findOne({ book: { $in: ids } });
      const review = await Review.findOne({ book: { $in: ids } });

      if (!bookAction && !review) {
        await Book.deleteMany({
          _id: { $in: ids },
        });
        return res.json({
          message: `Books with ids [${ids}] were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Book can't be deleted. This entry is linked to other schemes!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete books` });
    }
  }

  async deleteAuthor(req, res) {
    const { id } = req.params;
    try {
      const book = await Book.findOne({
        author: id,
      });

      if (!book) {
        const author = await Author.findByIdAndDelete({ _id: id });
        return res.json({
          message: `${author.first_name} ${author.last_name} were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Author can't be deleted. This entry is linked with ${book.title}!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete author with id ${id}` });
    }
  }

  async deleteManyAuthors(req, res) {
    try {
      const { ids } = req.body;
      const book = await Book.findOne({
        author: { $in: ids },
      });

      if (!book) {
        await Author.deleteMany({
          _id: { $in: ids },
        });
        return res.json({
          message: `Authors with ids [${ids}] were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Author can't be deleted. This entry is linked with ${book.title}!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete authors` });
    }
  }

  async deleteGenre(req, res) {
    const { id } = req.params;
    try {
      const book = await Book.findOne({
        author: id,
      });

      if (!book) {
        const genre = await Genre.findByIdAndDelete({ _id: id });
        return res.json({
          message: `${genre.name} were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Genre can't be deleted. This entry is linked with ${book.title}!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete genre with id ${id}` });
    }
  }

  async deleteManyGenres(req, res) {
    try {
      const { ids } = req.body;
      const book = await Book.findOne({
        author: { $in: ids },
      });

      if (!book) {
        await Genre.deleteMany({
          _id: { $in: ids },
        });
        return res.json({
          message: `Genres with ids [${ids}] were deleted successfully!`,
        });
      } else {
        return res.status(400).json({
          message: `Author can't be deleted. This entry is linked with ${book.title}!`,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: `Cannot delete genres` });
    }
  }

  async deleteReservedBook(req, res) {
    const { id } = req.params;
    try {
      const { book } = req.body;
      const reservedBook = await BookInstance.findByIdAndDelete({ _id: id });

      await Book.findOneAndUpdate(
        { _id: book._id },
        {
          $set: {
            count: book.count + 1,
          },
        },

        { new: true, useFindAndModify: false }
      );

      return res.json({
        message: `${reservedBook.book.title} - Reserved book were deleted successfully!`,
      });
    } catch (e) {
      console.log(e);
      res
        .status(400)
        .json({ message: `Cannot delete reserved book with id ${id}` });
    }
  }

  async deleteReview(req, res) {
    const { id } = req.params;
    try {
      const { book } = req.body;
      const reservedBook = await Review.findByIdAndDelete({ _id: id });

      await Book.findOneAndUpdate(
        { _id: book._id },
        { ...book, count: book.count + 1 },
        { new: true, useFindAndModify: false }
      );

      return res.json({
        message: `${reservedBook.book.title} - Reserved book were deleted successfully!`,
      });
    } catch (e) {
      console.log(e);
      res
        .status(400)
        .json({ message: `Cannot delete reserved book with id ${id}` });
    }
  }
}

///END DELETE///

module.exports = new bookController();
