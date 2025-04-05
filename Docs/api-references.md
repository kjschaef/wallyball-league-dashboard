# API References

## Overview

The Volleyball League Management Platform exposes RESTful API endpoints for interacting with the application data. This document details the available endpoints, request formats, and response structures.

## Base URL

All API paths are relative to the base URL of the application.

## Player Endpoints

### Get All Players

Retrieves a list of all players with their statistics.

- **Endpoint**: `/api/players`
- **Method**: `GET`
- **Response**: Array of player objects with calculated statistics:
  ```json
  [
    {
      "id": 1,
      "name": "Player Name",
      "startYear": 2020,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "matches": [
        {
          "date": "2025-03-15T00:00:00.000Z",
          "won": true,
          "isTeamOne": true,
          "teamOneGamesWon": 3,
          "teamTwoGamesWon": 1
        }
      ],
      "stats": {
        "won": 10,
        "lost": 5,
        "totalMatchTime": 15
      }
    }
  ]
  ```

### Create Player

Creates a new player.

- **Endpoint**: `/api/players`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "New Player",
    "startYear": 2025
  }
  ```
- **Response**: The created player object

### Get Player

Retrieves a specific player by ID.

- **Endpoint**: `/api/players/:id`
- **Method**: `GET`
- **Response**: The player object with statistics

### Update Player

Updates an existing player.

- **Endpoint**: `/api/players/:id`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "startYear": 2024
  }
  ```
- **Response**: The updated player object

### Delete Player

Deletes a player and associated matches.

- **Endpoint**: `/api/players/:id`
- **Method**: `DELETE`
- **Response**: Status code 204 (No Content)

## Match Endpoints

### Get All Matches

Retrieves all recorded matches.

- **Endpoint**: `/api/matches`
- **Method**: `GET`
- **Response**: Array of match objects
  ```json
  [
    {
      "id": 1,
      "teamOnePlayerOneId": 1,
      "teamOnePlayerTwoId": 2,
      "teamOnePlayerThreeId": null,
      "teamTwoPlayerOneId": 3,
      "teamTwoPlayerTwoId": 4,
      "teamTwoPlayerThreeId": null,
      "teamOneGamesWon": 3,
      "teamTwoGamesWon": 2,
      "date": "2025-04-01T00:00:00.000Z",
      "teamOnePlayers": ["Player 1", "Player 2"],
      "teamTwoPlayers": ["Player 3", "Player 4"]
    }
  ]
  ```

### Record Match (Create Match)

Records a new match.

- **Endpoint**: `/api/games` (Alias for matches)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "teamOnePlayerOneId": 1,
    "teamOnePlayerTwoId": 2,
    "teamOnePlayerThreeId": null,
    "teamTwoPlayerOneId": 3,
    "teamTwoPlayerTwoId": 4,
    "teamTwoPlayerThreeId": null,
    "teamOneGamesWon": 3,
    "teamTwoGamesWon": 2,
    "date": "2025-04-01T00:00:00.000Z"
  }
  ```
- **Response**: The created match object

## Achievement Endpoints

### Get Player Achievements

Retrieves achievements for a specific player.

- **Endpoint**: `/api/achievements/:playerId`
- **Method**: `GET`
- **Response**: Array of achievement objects
  ```json
  [
    {
      "id": 1,
      "name": "First Game Played",
      "description": "Played your first game",
      "icon": "Medal",
      "unlockedAt": "2025-03-15T00:00:00.000Z"
    }
  ]
  ```

## Error Handling

All API endpoints follow a consistent error handling pattern:

- **4xx Errors**: Client-side errors (e.g., invalid input, resource not found)
- **5xx Errors**: Server-side errors

Error responses include:
```json
{
  "error": "Error message describing the issue"
}
```

## Authentication

The API currently does not require authentication. All endpoints are publicly accessible.