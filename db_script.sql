CREATE DATABASE IF NOT EXISTS ODFBC;
USE ODFBC;

DROP TABLE IF EXISTS Review;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Book_Genres;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS Book;
DROP TABLE IF EXISTS User;

CREATE TABLE User (
	userId INT NOT NULL AUTO_INCREMENT,
	username VARBINARY(92) NOT NULL, 
	password VARBINARY(92) NULL,
	email VARBINARY(284) NULL,
	
	CONSTRAINT unique_username UNIQUE(username),
	PRIMARY KEY (userId)
);
ALTER TABLE User ADD accessLevel TINYINT;

CREATE TABLE Book(
	bookId INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(255),
	author VARCHAR(128),
	coverImg VARCHAR(255),
	ISBN13 VARCHAR(13),
    publisher VARCHAR(128),
	ISBN10 VARCHAR(10),

	CONSTRAINT unique_ISBN UNIQUE(ISBN13, ISBN10),
	PRIMARY KEY (bookId)
);
ALTER TABLE Book ADD coverSmallImg VARCHAR(255);
ALTER TABLE Book ADD publishDate DATE;


CREATE TABLE Review(
	reviewId INT NOT NULL AUTO_INCREMENT,
	userId INT NOT NULL,
	bookId INT NOT NULL,
	review varchar(512),
	
	PRIMARY KEY(reviewId),
	FOREIGN KEY(userId) REFERENCES User (userId) ON DELETE CASCADE,
	FOREIGN KEY(bookId) REFERENCES Book (bookId) ON DELETE CASCADE
);
ALTER TABLE Review ADD uploadDate DATE;

CREATE TABLE Rating(
	userId INT NOT NULL,
	bookId INT NOT NULL,
	rating TINYINT,

	CONSTRAINT checkRating check(rating > -1 AND rating < 11),
	FOREIGN KEY(userId) REFERENCES User (userId) ON DELETE CASCADE,
	FOREIGN KEY(bookId) REFERENCES Book (bookId) ON DELETE CASCADE,
    PRIMARY KEY(userId, bookId)
);

CREATE TABLE Genre(
	genreId INT NOT NULL AUTO_INCREMENT,
	genre VARCHAR(64),

	PRIMARY KEY(genreId)
);

INSERT INTO Genre (genreId, genre) VALUES 
(NULL, 'Fiction'), 
(NULL, 'Non-Fiction'),
(NULL, 'Horror'),
(NULL, 'Fantasy'),
(NULL, 'Science Fiction'),
(NULL, 'Historical Fiction'),
(NULL, 'Romance'),
(NULL, 'History'),
(NULL, 'Literacy'),
(NULL, 'Literacy Fiction'),
(Null, 'Memoir'),
(NULL, 'Action'),
(NULL, 'Adventure'),
(NULL, 'Poetry'),
(NULL, 'Thriller'),
(NULL, 'Crime'),
(NULL, 'Mystery'),
(NULL, 'Drama'),
(NULL, 'Humour'),
(NULL, 'Comedy'),
(NULL, 'Biography'),
(NULL, 'Anthology'),
(NULL, 'Politics'),
(NULL, 'Political Science'),
(NULL, 'Political Fiction'),
(NULL, 'Adventure Fiction'),
(NULL, 'Cooking'),
(NULL, 'Dystopia'),
(NULL, 'Fairy Tale'),
(NULL, 'Western Fiction'),
(NULL, 'Alternate History'),
(NULL, 'Science'),
(NULL, 'Philosophy'),
(NULL, 'Detective'),
(NULL, 'Business'),
(NULL, 'Economics'),
(NULL, 'Textbook'),
(NULL, 'Educational'),
(NULL, 'Entertainment'),
(NULL, 'Autobiograph'),
(NULL, 'Myth'),
(NULL, 'Satire');

Create TABLE Book_Genres(
	genreId INT NOT NULL,
	bookId INT NOT NULL,

	FOREIGN KEY(genreId) REFERENCES Genre (genreId) ON DELETE CASCADE,
	FOREIGN KEY(bookId) REFERENCES Book (bookId) ON DELETE CASCADE,
	PRIMARY KEY(genreId, bookId)
);