CREATE DATABASE IF NOT EXISTS finalDB;
USE finalDB;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS convoy_messages;
DROP TABLE IF EXISTS group_messages;
DROP TABLE IF EXISTS group_chat_members;
DROP TABLE IF EXISTS group_chats;
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS gps;
DROP TABLE IF EXISTS convoy_members;
DROP TABLE IF EXISTS convoys;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    userID INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_picture VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID),
    UNIQUE KEY uq_users_username (userName),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE convoys (
    convoyID INT NOT NULL AUTO_INCREMENT,
    joinCode VARCHAR(20) NOT NULL,
    host_userID INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (convoyID),
    UNIQUE KEY uq_convoys_joinCode (joinCode),
    CONSTRAINT fk_convoys_host FOREIGN KEY (host_userID) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE convoy_members (
    userID INT NOT NULL,
    convoyID INT NOT NULL,
    role ENUM('host', 'member') NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, convoyID),
    CONSTRAINT fk_convoy_members_user FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
    CONSTRAINT fk_convoy_members_convoy FOREIGN KEY (convoyID) REFERENCES convoys(convoyID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE gps (
    userID INT NOT NULL,
    convoyID INT NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, convoyID),
    CONSTRAINT fk_gps_user FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
    CONSTRAINT fk_gps_convoy FOREIGN KEY (convoyID) REFERENCES convoys(convoyID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE friendships (
    id CHAR(36) NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_friend_pair (sender_id, receiver_id),
    CONSTRAINT fk_friendships_sender FOREIGN KEY (sender_id) REFERENCES users(userID) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_receiver FOREIGN KEY (receiver_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE messages (
    id INT NOT NULL AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(userID) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE blocks (
    id INT NOT NULL AUTO_INCREMENT,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_block_pair (blocker_id, blocked_id),
    CONSTRAINT fk_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES users(userID) ON DELETE CASCADE,
    CONSTRAINT fk_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE convoy_messages (
    id INT NOT NULL AUTO_INCREMENT,
    convoyID INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_convoy_messages_convoyID (convoyID),
    KEY idx_convoy_messages_sender_id (sender_id),
    CONSTRAINT fk_convoy_messages_convoy FOREIGN KEY (convoyID) REFERENCES convoys(convoyID) ON DELETE CASCADE,
    CONSTRAINT fk_convoy_messages_sender FOREIGN KEY (sender_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE group_chats (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_group_chats_creator FOREIGN KEY (created_by) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE group_chat_members (
    id INT NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_group_member (group_id, user_id),
    CONSTRAINT fk_group_chat_members_group FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_chat_members_user FOREIGN KEY (user_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE group_messages (
    id INT NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_group_messages_group_id (group_id),
    KEY idx_group_messages_sender_id (sender_id),
    CONSTRAINT fk_group_messages_group FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_messages_sender FOREIGN KEY (sender_id) REFERENCES users(userID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO users (userName, first_name, last_name, email, password)
VALUES
('JMomen', 'Momen', 'Jaber', 'momen@example.com', SHA2('Test123!', 256)),
('TestUser2', 'Ali', 'Khan', 'ali@example.com', SHA2('Test456!', 256));