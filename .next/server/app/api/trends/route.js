/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/trends/route";
exports.ids = ["app/api/trends/route"];
exports.modules = {

/***/ "(rsc)/./app/api/trends/route.ts":
/*!*********************************!*\
  !*** ./app/api/trends/route.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! drizzle-orm */ \"(rsc)/./node_modules/drizzle-orm/sql/expressions/conditions.js\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfWeek.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/subWeeks.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/endOfWeek.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfMonth.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/subMonths.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/endOfMonth.mjs\");\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../db */ \"(rsc)/./db/index.ts\");\n/* harmony import */ var _db_schema__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../db/schema */ \"(rsc)/./db/schema.ts\");\n\n\n\n\n\n// Sample player colors for visualization\nconst playerColors = [\n    '#FF6B6B',\n    '#4E4EFF',\n    '#62D962',\n    '#FF7E67',\n    '#BADA55',\n    '#FFD700',\n    '#20B2AA',\n    '#FF8C00',\n    '#00CED1',\n    '#FF69B4'\n];\nasync function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const period = searchParams.get(\"period\") || \"weekly\";\n        const playerIdParam = searchParams.get(\"playerId\");\n        const playerId = playerIdParam ? parseInt(playerIdParam) : undefined;\n        const currentDate = new Date();\n        // Calculate date ranges based on period\n        let periods = [];\n        if (period === \"weekly\") {\n            // Get last 4 weeks\n            for(let i = 0; i < 4; i++){\n                const weekStart = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_3__.startOfWeek)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_4__.subWeeks)(currentDate, i));\n                const weekEnd = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_5__.endOfWeek)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_4__.subWeeks)(currentDate, i));\n                periods.push({\n                    start: weekStart,\n                    end: weekEnd\n                });\n            }\n        } else {\n            // Get last 3 months\n            for(let i = 0; i < 3; i++){\n                const monthStart = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_6__.startOfMonth)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_7__.subMonths)(currentDate, i));\n                const monthEnd = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_8__.endOfMonth)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_7__.subMonths)(currentDate, i));\n                periods.push({\n                    start: monthStart,\n                    end: monthEnd\n                });\n            }\n        }\n        // Get performance data for each period\n        const trendsData = await Promise.all(periods.map(async ({ start, end })=>{\n            // Create base conditions for date range\n            let conditions = (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.and)((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.gte)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.date, start), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.lte)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.date, end));\n            // Add player filter if specified\n            if (playerId) {\n                conditions = (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.and)(conditions, (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.or)((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamOnePlayerOneId, playerId), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamOnePlayerTwoId, playerId), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamOnePlayerThreeId, playerId), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamTwoPlayerOneId, playerId), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamTwoPlayerTwoId, playerId), (0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__.eq)(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches.teamTwoPlayerThreeId, playerId)));\n            }\n            const periodGames = await _db__WEBPACK_IMPORTED_MODULE_1__.db.select().from(_db_schema__WEBPACK_IMPORTED_MODULE_2__.matches).where(conditions);\n            // Calculate performance metrics\n            const stats = periodGames.reduce((acc, game)=>{\n                if (playerId) {\n                    const isTeamOne = game.teamOnePlayerOneId === playerId || game.teamOnePlayerTwoId === playerId || game.teamOnePlayerThreeId === playerId;\n                    const gamesWon = isTeamOne ? game.teamOneGamesWon : game.teamTwoGamesWon;\n                    const gamesLost = isTeamOne ? game.teamTwoGamesWon : game.teamOneGamesWon;\n                    return {\n                        gamesWon: acc.gamesWon + gamesWon,\n                        gamesLost: acc.gamesLost + gamesLost,\n                        totalGames: acc.totalGames + 1\n                    };\n                }\n                // Team-wide stats if no player specified\n                return {\n                    gamesWon: acc.gamesWon + game.teamOneGamesWon + game.teamTwoGamesWon,\n                    gamesLost: acc.gamesLost + game.teamTwoGamesWon + game.teamOneGamesWon,\n                    totalGames: acc.totalGames + 1\n                };\n            }, {\n                gamesWon: 0,\n                gamesLost: 0,\n                totalGames: 0\n            });\n            return {\n                period: start.toISOString(),\n                ...stats,\n                winRate: stats.totalGames > 0 ? stats.gamesWon / (stats.gamesWon + stats.gamesLost) * 100 : 0\n            };\n        }));\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(trendsData.reverse()); // Most recent first\n    } catch (error) {\n        console.error(\"Error fetching performance trends:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to fetch performance trends\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LEdBQUdGLElBQUksQ0FBQ0csZUFBZSxHQUFHSCxJQUFJLENBQUNJLGVBQWU7b0JBQ3BFQyxTQUFTLEVBQUVOLEdBQUcsQ0FBQ00sU0FBUyxHQUFHTCxJQUFJLENBQUNJLGVBQWUsR0FBR0osSUFBSSxDQUFDRyxlQUFlO29CQUN0RUcsVUFBVSxFQUFFUCxHQUFHLENBQUNPLFVBQVUsR0FBRztnQkFDL0IsQ0FBQztZQUNILENBQUMsRUFDRDtnQkFBRUosUUFBUSxFQUFFLENBQUM7Z0JBQUVHLFNBQVMsRUFBRSxDQUFDO2dCQUFFQyxVQUFVLEVBQUU7WUFBRSxDQUM3QyxDQUFDO1lBRUQsT0FBTztnQkFDTDFDLE1BQU0sRUFBRWEsS0FBSyxDQUFDOEIsV0FBVyxDQUFDLENBQUM7Z0JBQzNCLEdBQUdWLEtBQUs7Z0JBQ1JXLE9BQU8sRUFBRVgsS0FBSyxDQUFDUyxVQUFVLEdBQUcsQ0FBQyxHQUFJVCxLQUFLLENBQUNLLFFBQVEsSUFBSUwsS0FBSyxDQUFDSyxRQUFRLEdBQUdMLEtBQUssQ0FBQ1EsU0FBQUEsQ0FBVSxHQUFJLEdBQUcsR0FBRztZQUNoRyxDQUFDO1FBQ0gsQ0FBQyxDQUNILENBQUM7UUFFRCxPQUFPN0QscURBQVksQ0FBQ2lFLElBQUksQ0FBQzVCLFVBQVUsQ0FBQzZCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUMsQ0FBQyxPQUFPQyxLQUFLLEVBQUU7UUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsb0NBQW9DLEVBQUVBLEtBQUssQ0FBQztRQUMxRCxPQUFPbkUscURBQVksQ0FBQ2lFLElBQUksQ0FDdEI7WUFBRUUsS0FBSyxFQUFFO1FBQXFDLENBQUMsRUFDL0M7WUFBRUUsTUFBTSxFQUFFO1FBQUksQ0FDaEIsQ0FBQztJQUNIO0FBQ0YiLCJzb3VyY2VzIjpbIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS90cmVuZHMvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyBhbmQsIGVxLCBndGUsIGx0ZSwgb3IgfSBmcm9tIFwiZHJpenpsZS1vcm1cIjtcbmltcG9ydCB7IHN0YXJ0T2ZXZWVrLCBlbmRPZldlZWssIHN0YXJ0T2ZNb250aCwgZW5kT2ZNb250aCwgc3ViTW9udGhzLCBzdWJXZWVrcyB9IGZyb20gXCJkYXRlLWZuc1wiO1xuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi4vLi4vLi4vZGJcIjtcbmltcG9ydCB7IG1hdGNoZXMgfSBmcm9tIFwiLi4vLi4vLi4vZGIvc2NoZW1hXCI7XG5cbi8vIFNhbXBsZSBwbGF5ZXIgY29sb3JzIGZvciB2aXN1YWxpemF0aW9uXG5jb25zdCBwbGF5ZXJDb2xvcnMgPSBbXG4gICcjRkY2QjZCJywgJyM0RTRFRkYnLCAnIzYyRDk2MicsICcjRkY3RTY3JywgJyNCQURBNTUnLFxuICAnI0ZGRDcwMCcsICcjMjBCMkFBJywgJyNGRjhDMDAnLCAnIzAwQ0VEMScsICcjRkY2OUI0J1xuXTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICAgIGNvbnN0IHBlcmlvZCA9IHNlYXJjaFBhcmFtcy5nZXQoXCJwZXJpb2RcIikgfHwgXCJ3ZWVrbHlcIjtcbiAgICBjb25zdCBwbGF5ZXJJZFBhcmFtID0gc2VhcmNoUGFyYW1zLmdldChcInBsYXllcklkXCIpO1xuICAgIGNvbnN0IHBsYXllcklkID0gcGxheWVySWRQYXJhbSA/IHBhcnNlSW50KHBsYXllcklkUGFyYW0pIDogdW5kZWZpbmVkO1xuICAgIFxuICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcblxuICAgIC8vIENhbGN1bGF0ZSBkYXRlIHJhbmdlcyBiYXNlZCBvbiBwZXJpb2RcbiAgICBsZXQgcGVyaW9kcyA9IFtdO1xuICAgIGlmIChwZXJpb2QgPT09IFwid2Vla2x5XCIpIHtcbiAgICAgIC8vIEdldCBsYXN0IDQgd2Vla3NcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHdlZWtTdGFydCA9IHN0YXJ0T2ZXZWVrKHN1YldlZWtzKGN1cnJlbnREYXRlLCBpKSk7XG4gICAgICAgIGNvbnN0IHdlZWtFbmQgPSBlbmRPZldlZWsoc3ViV2Vla3MoY3VycmVudERhdGUsIGkpKTtcbiAgICAgICAgcGVyaW9kcy5wdXNoKHsgc3RhcnQ6IHdlZWtTdGFydCwgZW5kOiB3ZWVrRW5kIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBHZXQgbGFzdCAzIG1vbnRoc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgY29uc3QgbW9udGhTdGFydCA9IHN0YXJ0T2ZNb250aChzdWJNb250aHMoY3VycmVudERhdGUsIGkpKTtcbiAgICAgICAgY29uc3QgbW9udGhFbmQgPSBlbmRPZk1vbnRoKHN1Yk1vbnRocyhjdXJyZW50RGF0ZSwgaSkpO1xuICAgICAgICBwZXJpb2RzLnB1c2goeyBzdGFydDogbW9udGhTdGFydCwgZW5kOiBtb250aEVuZCB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZXQgcGVyZm9ybWFuY2UgZGF0YSBmb3IgZWFjaCBwZXJpb2RcbiAgICBjb25zdCB0cmVuZHNEYXRhID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBwZXJpb2RzLm1hcChhc3luYyAoeyBzdGFydCwgZW5kIH0pID0+IHtcbiAgICAgICAgLy8gQ3JlYXRlIGJhc2UgY29uZGl0aW9ucyBmb3IgZGF0ZSByYW5nZVxuICAgICAgICBsZXQgY29uZGl0aW9ucyA9IGFuZChcbiAgICAgICAgICBndGUobWF0Y2hlcy5kYXRlLCBzdGFydCksXG4gICAgICAgICAgbHRlKG1hdGNoZXMuZGF0ZSwgZW5kKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEFkZCBwbGF5ZXIgZmlsdGVyIGlmIHNwZWNpZmllZFxuICAgICAgICBpZiAocGxheWVySWQpIHtcbiAgICAgICAgICBjb25kaXRpb25zID0gYW5kKFxuICAgICAgICAgICAgY29uZGl0aW9ucyxcbiAgICAgICAgICAgIG9yKFxuICAgICAgICAgICAgICBlcShtYXRjaGVzLnRlYW1PbmVQbGF5ZXJPbmVJZCwgcGxheWVySWQpLFxuICAgICAgICAgICAgICBlcShtYXRjaGVzLnRlYW1PbmVQbGF5ZXJUd29JZCwgcGxheWVySWQpLFxuICAgICAgICAgICAgICBlcShtYXRjaGVzLnRlYW1PbmVQbGF5ZXJUaHJlZUlkLCBwbGF5ZXJJZCksXG4gICAgICAgICAgICAgIGVxKG1hdGNoZXMudGVhbVR3b1BsYXllck9uZUlkLCBwbGF5ZXJJZCksXG4gICAgICAgICAgICAgIGVxKG1hdGNoZXMudGVhbVR3b1BsYXllclR3b0lkLCBwbGF5ZXJJZCksXG4gICAgICAgICAgICAgIGVxKG1hdGNoZXMudGVhbVR3b1BsYXllclRocmVlSWQsIHBsYXllcklkKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwZXJpb2RHYW1lcyA9IGF3YWl0IGRiXG4gICAgICAgICAgLnNlbGVjdCgpXG4gICAgICAgICAgLmZyb20obWF0Y2hlcylcbiAgICAgICAgICAud2hlcmUoY29uZGl0aW9ucyk7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHBlcmZvcm1hbmNlIG1ldHJpY3NcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBwZXJpb2RHYW1lcy5yZWR1Y2UoXG4gICAgICAgICAgKGFjYywgZ2FtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHBsYXllcklkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGlzVGVhbU9uZSA9XG4gICAgICAgICAgICAgICAgZ2FtZS50ZWFtT25lUGxheWVyT25lSWQgPT09IHBsYXllcklkIHx8XG4gICAgICAgICAgICAgICAgZ2FtZS50ZWFtT25lUGxheWVyVHdvSWQgPT09IHBsYXllcklkIHx8XG4gICAgICAgICAgICAgICAgZ2FtZS50ZWFtT25lUGxheWVyVGhyZWVJZCA9PT0gcGxheWVySWQ7XG5cbiAgICAgICAgICAgICAgY29uc3QgZ2FtZXNXb24gPSBpc1RlYW1PbmUgPyBnYW1lLnRlYW1PbmVHYW1lc1dvbiA6IGdhbWUudGVhbVR3b0dhbWVzV29uO1xuICAgICAgICAgICAgICBjb25zdCBnYW1lc0xvc3QgPSBpc1RlYW1PbmUgPyBnYW1lLnRlYW1Ud29HYW1lc1dvbiA6IGdhbWUudGVhbU9uZUdhbWVzV29uO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZ2FtZXNXb246IGFjYy5nYW1lc1dvbiArIGdhbWVzV29uLFxuICAgICAgICAgICAgICAgIGdhbWVzTG9zdDogYWNjLmdhbWVzTG9zdCArIGdhbWVzTG9zdCxcbiAgICAgICAgICAgICAgICB0b3RhbEdhbWVzOiBhY2MudG90YWxHYW1lcyArIDEsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRlYW0td2lkZSBzdGF0cyBpZiBubyBwbGF5ZXIgc3BlY2lmaWVkXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBnYW1lc1dvbjogYWNjLmdhbWVzV29uICsgZ2FtZS50ZWFtT25lR2FtZXNXb24gKyBnYW1lLnRlYW1Ud29HYW1lc1dvbixcbiAgICAgICAgICAgICAgZ2FtZXNMb3N0OiBhY2MuZ2FtZXNMb3N0ICsgZ2FtZS50ZWFtVHdvR2FtZXNXb24gKyBnYW1lLnRlYW1PbmVHYW1lc1dvbixcbiAgICAgICAgICAgICAgdG90YWxHYW1lczogYWNjLnRvdGFsR2FtZXMgKyAxLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgZ2FtZXNXb246IDAsIGdhbWVzTG9zdDogMCwgdG90YWxHYW1lczogMCB9XG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwZXJpb2Q6IHN0YXJ0LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgLi4uc3RhdHMsXG4gICAgICAgICAgd2luUmF0ZTogc3RhdHMudG90YWxHYW1lcyA+IDAgPyAoc3RhdHMuZ2FtZXNXb24gLyAoc3RhdHMuZ2FtZXNXb24gKyBzdGF0cy5nYW1lc0xvc3QpKSAqIDEwMCA6IDAsXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24odHJlbmRzRGF0YS5yZXZlcnNlKCkpOyAvLyBNb3N0IHJlY2VudCBmaXJzdFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBwZXJmb3JtYW5jZSB0cmVuZHM6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiBcIkZhaWxlZCB0byBmZXRjaCBwZXJmb3JtYW5jZSB0cmVuZHNcIiB9LFxuICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgKTtcbiAgfVxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJhbmQiLCJlcSIsImd0ZSIsImx0ZSIsIm9yIiwic3RhcnRPZldlZWsiLCJlbmRPZldlZWsiLCJzdGFydE9mTW9udGgiLCJlbmRPZk1vbnRoIiwic3ViTW9udGhzIiwic3ViV2Vla3MiLCJkYiIsIm1hdGNoZXMiLCJwbGF5ZXJDb2xvcnMiLCJHRVQiLCJyZXF1ZXN0Iiwic2VhcmNoUGFyYW1zIiwiVVJMIiwidXJsIiwicGVyaW9kIiwiZ2V0IiwicGxheWVySWRQYXJhbSIsInBsYXllcklkIiwicGFyc2VJbnQiLCJ1bmRlZmluZWQiLCJjdXJyZW50RGF0ZSIsIkRhdGUiLCJwZXJpb2RzIiwiaSIsIndlZWtTdGFydCIsIndlZWtFbmQiLCJwdXNoIiwic3RhcnQiLCJlbmQiLCJtb250aFN0YXJ0IiwibW9udGhFbmQiLCJ0cmVuZHNEYXRhIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImNvbmRpdGlvbnMiLCJkYXRlIiwidGVhbU9uZVBsYXllck9uZUlkIiwidGVhbU9uZVBsYXllclR3b0lkIiwidGVhbU9uZVBsYXllclRocmVlSWQiLCJ0ZWFtVHdvUGxheWVyT25lSWQiLCJ0ZWFtVHdvUGxheWVyVHdvSWQiLCJ0ZWFtVHdvUGxheWVyVGhyZWVJZCIsInBlcmlvZEdhbWVzIiwic2VsZWN0IiwiZnJvbSIsIndoZXJlIiwic3RhdHMiLCJyZWR1Y2UiLCJhY2MiLCJnYW1lIiwiaXNUZWFtT25lIiwiZ2FtZXNXb24iLCJ0ZWFtT25lR2FtZXNXb24iLCJ0ZWFtVHdvR2FtZXNXb24iLCJnYW1lc0xvc3QiLCJ0b3RhbEdhbWVzIiwidG9JU09TdHJpbmciLCJ3aW5SYXRlIiwianNvbiIsInJldmVyc2UiLCJlcnJvciIsImNvbnNvbGUiLCJzdGF0dXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/trends/route.ts\n");

/***/ }),

/***/ "(rsc)/./db/config.ts":
/*!**********************!*\
  !*** ./db/config.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getDatabase: () => (/* binding */ getDatabase),\n/* harmony export */   getEnvironment: () => (/* binding */ getEnvironment)\n/* harmony export */ });\n/* harmony import */ var drizzle_orm_neon_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! drizzle-orm/neon-http */ \"(rsc)/./node_modules/drizzle-orm/neon-http/driver.js\");\n/* harmony import */ var _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @neondatabase/serverless */ \"(rsc)/./node_modules/@neondatabase/serverless/index.mjs\");\n/* harmony import */ var ws__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ws */ \"(rsc)/./node_modules/ws/wrapper.mjs\");\n/* harmony import */ var _schema__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./schema */ \"(rsc)/./db/schema.ts\");\n\n\n\n\nconst getEnvironment = ()=>{\n    return \"development\" || 0;\n};\nfunction getDatabase(overrideUrl) {\n    const env = getEnvironment();\n    const dbUrl = overrideUrl || (env === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL);\n    if (!dbUrl) {\n        throw new Error(`Database URL must be set for ${env} environment`);\n    }\n    if (env !== 'production') {\n        _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__.neonConfig.webSocketConstructor = ws__WEBPACK_IMPORTED_MODULE_1__[\"default\"];\n    }\n    const sql = (0,_neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__.neon)(dbUrl);\n    return (0,drizzle_orm_neon_http__WEBPACK_IMPORTED_MODULE_3__.drizzle)(sql, {\n        schema: _schema__WEBPACK_IMPORTED_MODULE_2__\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9kYi9jb25maWcudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQytDO0FBQ1k7QUFDeEM7QUFDZTtBQUUzQixNQUFNSyxjQUFjLEdBQUdBLENBQUE7SUFDNUIsT0FBTyxpQkFBd0IsQ0FBYTtBQUM5QyxDQUFDO0FBRU0sU0FBU0MsV0FBV0EsQ0FBQ0MsV0FBb0IsRUFBRTtJQUNoRCxNQUFNQyxHQUFHLEdBQUdILGNBQWMsQ0FBQyxDQUFDO0lBQzVCLE1BQU1JLEtBQUssR0FBR0YsV0FBVyxLQUFLQyxHQUFHLEtBQUssTUFBTSxHQUN4Q0UsT0FBTyxDQUFDRixHQUFHLENBQUNHLGlCQUFpQixHQUM3QkQsT0FBTyxDQUFDRixHQUFHLENBQUNJLFlBQUFBLENBQWE7SUFFN0IsSUFBSSxDQUFDSCxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUlJLEtBQUssQ0FBRSxnQ0FBK0JMLEdBQUksY0FBYSxDQUFDO0lBQ3BFO0lBRUEsSUFBSUEsR0FBRyxLQUFLLFlBQVksRUFBRTtRQUN4Qk4sZ0VBQVUsQ0FBQ1ksb0JBQW9CLEdBQUdYLDBDQUFFO0lBQ3RDO0lBRUEsTUFBTVksR0FBRyxHQUFHZCw4REFBSSxDQUFDUSxLQUFLLENBQUM7SUFFdkIsT0FBT1QsOERBQU8sQ0FBQ2UsR0FBRyxFQUFFO1FBQUVYLE1BQU1BLHNDQUFBQTtJQUFDLENBQUMsQ0FBQztBQUNqQyIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9kYi9jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBkcml6emxlIH0gZnJvbSBcImRyaXp6bGUtb3JtL25lb24taHR0cFwiO1xuaW1wb3J0IHsgbmVvbiwgbmVvbkNvbmZpZyB9IGZyb20gXCJAbmVvbmRhdGFiYXNlL3NlcnZlcmxlc3NcIjtcbmltcG9ydCB3cyBmcm9tIFwid3NcIjtcbmltcG9ydCAqIGFzIHNjaGVtYSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuZXhwb3J0IGNvbnN0IGdldEVudmlyb25tZW50ID0gKCkgPT4ge1xuICByZXR1cm4gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50Jztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFiYXNlKG92ZXJyaWRlVXJsPzogc3RyaW5nKSB7XG4gIGNvbnN0IGVudiA9IGdldEVudmlyb25tZW50KCk7XG4gIGNvbnN0IGRiVXJsID0gb3ZlcnJpZGVVcmwgfHwgKGVudiA9PT0gJ3Rlc3QnIFxuICAgID8gcHJvY2Vzcy5lbnYuVEVTVF9EQVRBQkFTRV9VUkwgXG4gICAgOiBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwpO1xuICBcbiAgaWYgKCFkYlVybCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRGF0YWJhc2UgVVJMIG11c3QgYmUgc2V0IGZvciAke2Vudn0gZW52aXJvbm1lbnRgKTtcbiAgfVxuXG4gIGlmIChlbnYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIG5lb25Db25maWcud2ViU29ja2V0Q29uc3RydWN0b3IgPSB3cztcbiAgfVxuXG4gIGNvbnN0IHNxbCA9IG5lb24oZGJVcmwpO1xuXG4gIHJldHVybiBkcml6emxlKHNxbCwgeyBzY2hlbWEgfSk7XG59XG4iXSwibmFtZXMiOlsiZHJpenpsZSIsIm5lb24iLCJuZW9uQ29uZmlnIiwid3MiLCJzY2hlbWEiLCJnZXRFbnZpcm9ubWVudCIsImdldERhdGFiYXNlIiwib3ZlcnJpZGVVcmwiLCJlbnYiLCJkYlVybCIsInByb2Nlc3MiLCJURVNUX0RBVEFCQVNFX1VSTCIsIkRBVEFCQVNFX1VSTCIsIkVycm9yIiwid2ViU29ja2V0Q29uc3RydWN0b3IiLCJzcWwiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./db/config.ts\n");

/***/ }),

/***/ "(rsc)/./db/index.ts":
/*!*********************!*\
  !*** ./db/index.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ \"(rsc)/./db/config.ts\");\n\nconst db = (0,_config__WEBPACK_IMPORTED_MODULE_0__.getDatabase)();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9kYi9pbmRleC50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUNzQztBQUMvQixNQUFNQyxFQUFFLEdBQUdELG9EQUFXLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9kYi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IGdldERhdGFiYXNlIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5leHBvcnQgY29uc3QgZGIgPSBnZXREYXRhYmFzZSgpO1xuIl0sIm5hbWVzIjpbImdldERhdGFiYXNlIiwiZGIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./db/index.ts\n");

/***/ }),

/***/ "(rsc)/./db/schema.ts":
/*!**********************!*\
  !*** ./db/schema.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   achievements: () => (/* binding */ achievements),\n/* harmony export */   insertAchievementSchema: () => (/* binding */ insertAchievementSchema),\n/* harmony export */   insertMatchSchema: () => (/* binding */ insertMatchSchema),\n/* harmony export */   insertPlayerAchievementSchema: () => (/* binding */ insertPlayerAchievementSchema),\n/* harmony export */   insertPlayerSchema: () => (/* binding */ insertPlayerSchema),\n/* harmony export */   matches: () => (/* binding */ matches),\n/* harmony export */   playerAchievements: () => (/* binding */ playerAchievements),\n/* harmony export */   players: () => (/* binding */ players),\n/* harmony export */   selectAchievementSchema: () => (/* binding */ selectAchievementSchema),\n/* harmony export */   selectMatchSchema: () => (/* binding */ selectMatchSchema),\n/* harmony export */   selectPlayerAchievementSchema: () => (/* binding */ selectPlayerAchievementSchema),\n/* harmony export */   selectPlayerSchema: () => (/* binding */ selectPlayerSchema)\n/* harmony export */ });\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/table.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/serial.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/text.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/integer.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/timestamp.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/indexes.js\");\n/* harmony import */ var drizzle_zod__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! drizzle-zod */ \"(rsc)/./node_modules/drizzle-zod/index.mjs\");\n\n\nconst players = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"players\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    name: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"name\").notNull(),\n    startYear: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"start_year\"),\n    createdAt: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"created_at\").defaultNow()\n});\nconst matches = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"matches\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    // Team One Players\n    teamOnePlayerOneId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_one_id\").references(()=>players.id),\n    teamOnePlayerTwoId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_two_id\").references(()=>players.id),\n    teamOnePlayerThreeId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_three_id\").references(()=>players.id),\n    // Team Two Players\n    teamTwoPlayerOneId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_one_id\").references(()=>players.id),\n    teamTwoPlayerTwoId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_two_id\").references(()=>players.id),\n    teamTwoPlayerThreeId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_three_id\").references(()=>players.id),\n    // Scores\n    teamOneGamesWon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_games_won\").notNull(),\n    teamTwoGamesWon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_games_won\").notNull(),\n    date: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"date\").defaultNow()\n}, (table)=>({\n        teamOnePlayerOneIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_one_idx\").on(table.teamOnePlayerOneId),\n        teamOnePlayerTwoIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_two_idx\").on(table.teamOnePlayerTwoId),\n        teamOnePlayerThreeIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_three_idx\").on(table.teamOnePlayerThreeId),\n        teamTwoPlayerOneIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_one_idx\").on(table.teamTwoPlayerOneId),\n        teamTwoPlayerTwoIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_two_idx\").on(table.teamTwoPlayerTwoId),\n        teamTwoPlayerThreeIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_three_idx\").on(table.teamTwoPlayerThreeId)\n    }));\n// New achievements table\nconst achievements = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"achievements\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    name: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"name\").notNull(),\n    description: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"description\").notNull(),\n    icon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"icon\").notNull(),\n    // Achievement type (e.g., \"games_played\", \"games_won\")\n    condition: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"condition\").notNull() // Achievement condition (e.g., \"wins >= 10\")\n});\n// Player achievements junction table\nconst playerAchievements = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"player_achievements\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    playerId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"player_id\").references(()=>players.id).notNull(),\n    achievementId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"achievement_id\").references(()=>achievements.id).notNull(),\n    unlockedAt: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"unlocked_at\").defaultNow().notNull()\n}, (table)=>({\n        playerAchievementIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"player_achievement_idx\").on(table.playerId, table.achievementId)\n    }));\nconst insertPlayerSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(players);\nconst selectPlayerSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(players);\nconst insertMatchSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(matches);\nconst selectMatchSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(matches);\nconst insertAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(achievements);\nconst selectAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(achievements);\nconst insertPlayerAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(playerAchievements);\nconst selectPlayerAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(playerAchievements);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QWtCLENBQUNFLE9BQU8sQ0FBQztBQUN0RCxNQUFNcUMsa0JBQWtCLEdBQUd0QywrREFBa0IsQ0FBQ0MsT0FBTyxDQUFDO0FBQ3RELE1BQU1zQyxpQkFBaUIsR0FBR3hDLCtEQUFrQixDQUFDVSxPQUFPLENBQUM7QUFDckQsTUFBTStCLGlCQUFpQixHQUFHeEMsK0RBQWtCLENBQUNTLE9BQU8sQ0FBQztBQUNyRCxNQUFNZ0MsdUJBQXVCLEdBQUcxQywrREFBa0IsQ0FBQzZCLFlBQVksQ0FBQztBQUNoRSxNQUFNYyx1QkFBdUIsR0FBRzFDLCtEQUFrQixDQUFDNEIsWUFBWSxDQUFDO0FBQ2hFLE1BQU1lLDZCQUE2QixHQUFHNUMsK0RBQWtCLENBQUNpQyxrQkFBa0IsQ0FBQztBQUM1RSxNQUFNWSw2QkFBNkIsR0FBRzVDLCtEQUFrQixDQUFDZ0Msa0JBQWtCLENBQUMiLCJzb3VyY2VzIjpbIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvZGIvc2NoZW1hLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBnVGFibGUsIHRleHQsIHNlcmlhbCwgaW50ZWdlciwgdGltZXN0YW1wLCBpbmRleCwgYm9vbGVhbiB9IGZyb20gXCJkcml6emxlLW9ybS9wZy1jb3JlXCI7XG5pbXBvcnQgeyBjcmVhdGVJbnNlcnRTY2hlbWEsIGNyZWF0ZVNlbGVjdFNjaGVtYSB9IGZyb20gXCJkcml6emxlLXpvZFwiO1xuXG5leHBvcnQgY29uc3QgcGxheWVycyA9IHBnVGFibGUoXCJwbGF5ZXJzXCIsIHtcbiAgaWQ6IHNlcmlhbChcImlkXCIpLnByaW1hcnlLZXkoKSxcbiAgbmFtZTogdGV4dChcIm5hbWVcIikubm90TnVsbCgpLFxuICBzdGFydFllYXI6IGludGVnZXIoXCJzdGFydF95ZWFyXCIpLFxuICBjcmVhdGVkQXQ6IHRpbWVzdGFtcChcImNyZWF0ZWRfYXRcIikuZGVmYXVsdE5vdygpLFxufSk7XG5cbmV4cG9ydCBjb25zdCBtYXRjaGVzID0gcGdUYWJsZShcIm1hdGNoZXNcIiwge1xuICBpZDogc2VyaWFsKFwiaWRcIikucHJpbWFyeUtleSgpLFxuICAvLyBUZWFtIE9uZSBQbGF5ZXJzXG4gIHRlYW1PbmVQbGF5ZXJPbmVJZDogaW50ZWdlcihcInRlYW1fb25lX3BsYXllcl9vbmVfaWRcIikucmVmZXJlbmNlcygoKSA9PiBwbGF5ZXJzLmlkKSxcbiAgdGVhbU9uZVBsYXllclR3b0lkOiBpbnRlZ2VyKFwidGVhbV9vbmVfcGxheWVyX3R3b19pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICB0ZWFtT25lUGxheWVyVGhyZWVJZDogaW50ZWdlcihcInRlYW1fb25lX3BsYXllcl90aHJlZV9pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICAvLyBUZWFtIFR3byBQbGF5ZXJzXG4gIHRlYW1Ud29QbGF5ZXJPbmVJZDogaW50ZWdlcihcInRlYW1fdHdvX3BsYXllcl9vbmVfaWRcIikucmVmZXJlbmNlcygoKSA9PiBwbGF5ZXJzLmlkKSxcbiAgdGVhbVR3b1BsYXllclR3b0lkOiBpbnRlZ2VyKFwidGVhbV90d29fcGxheWVyX3R3b19pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICB0ZWFtVHdvUGxheWVyVGhyZWVJZDogaW50ZWdlcihcInRlYW1fdHdvX3BsYXllcl90aHJlZV9pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICAvLyBTY29yZXNcbiAgdGVhbU9uZUdhbWVzV29uOiBpbnRlZ2VyKFwidGVhbV9vbmVfZ2FtZXNfd29uXCIpLm5vdE51bGwoKSxcbiAgdGVhbVR3b0dhbWVzV29uOiBpbnRlZ2VyKFwidGVhbV90d29fZ2FtZXNfd29uXCIpLm5vdE51bGwoKSxcbiAgZGF0ZTogdGltZXN0YW1wKFwiZGF0ZVwiKS5kZWZhdWx0Tm93KCksXG59LCAodGFibGUpID0+ICh7XG4gIHRlYW1PbmVQbGF5ZXJPbmVJZHg6IGluZGV4KFwidGVhbV9vbmVfcGxheWVyX29uZV9pZHhcIikub24odGFibGUudGVhbU9uZVBsYXllck9uZUlkKSxcbiAgdGVhbU9uZVBsYXllclR3b0lkeDogaW5kZXgoXCJ0ZWFtX29uZV9wbGF5ZXJfdHdvX2lkeFwiKS5vbih0YWJsZS50ZWFtT25lUGxheWVyVHdvSWQpLFxuICB0ZWFtT25lUGxheWVyVGhyZWVJZHg6IGluZGV4KFwidGVhbV9vbmVfcGxheWVyX3RocmVlX2lkeFwiKS5vbih0YWJsZS50ZWFtT25lUGxheWVyVGhyZWVJZCksXG4gIHRlYW1Ud29QbGF5ZXJPbmVJZHg6IGluZGV4KFwidGVhbV90d29fcGxheWVyX29uZV9pZHhcIikub24odGFibGUudGVhbVR3b1BsYXllck9uZUlkKSxcbiAgdGVhbVR3b1BsYXllclR3b0lkeDogaW5kZXgoXCJ0ZWFtX3R3b19wbGF5ZXJfdHdvX2lkeFwiKS5vbih0YWJsZS50ZWFtVHdvUGxheWVyVHdvSWQpLFxuICB0ZWFtVHdvUGxheWVyVGhyZWVJZHg6IGluZGV4KFwidGVhbV90d29fcGxheWVyX3RocmVlX2lkeFwiKS5vbih0YWJsZS50ZWFtVHdvUGxheWVyVGhyZWVJZCksXG59KSk7XG5cbi8vIE5ldyBhY2hpZXZlbWVudHMgdGFibGVcbmV4cG9ydCBjb25zdCBhY2hpZXZlbWVudHMgPSBwZ1RhYmxlKFwiYWNoaWV2ZW1lbnRzXCIsIHtcbiAgaWQ6IHNlcmlhbChcImlkXCIpLnByaW1hcnlLZXkoKSxcbiAgbmFtZTogdGV4dChcIm5hbWVcIikubm90TnVsbCgpLFxuICBkZXNjcmlwdGlvbjogdGV4dChcImRlc2NyaXB0aW9uXCIpLm5vdE51bGwoKSxcbiAgaWNvbjogdGV4dChcImljb25cIikubm90TnVsbCgpLCAvLyBBY2hpZXZlbWVudCB0eXBlIChlLmcuLCBcImdhbWVzX3BsYXllZFwiLCBcImdhbWVzX3dvblwiKVxuICBjb25kaXRpb246IHRleHQoXCJjb25kaXRpb25cIikubm90TnVsbCgpLCAvLyBBY2hpZXZlbWVudCBjb25kaXRpb24gKGUuZy4sIFwid2lucyA+PSAxMFwiKVxufSk7XG5cbi8vIFBsYXllciBhY2hpZXZlbWVudHMganVuY3Rpb24gdGFibGVcbmV4cG9ydCBjb25zdCBwbGF5ZXJBY2hpZXZlbWVudHMgPSBwZ1RhYmxlKFwicGxheWVyX2FjaGlldmVtZW50c1wiLCB7XG4gIGlkOiBzZXJpYWwoXCJpZFwiKS5wcmltYXJ5S2V5KCksXG4gIHBsYXllcklkOiBpbnRlZ2VyKFwicGxheWVyX2lkXCIpLnJlZmVyZW5jZXMoKCkgPT4gcGxheWVycy5pZCkubm90TnVsbCgpLFxuICBhY2hpZXZlbWVudElkOiBpbnRlZ2VyKFwiYWNoaWV2ZW1lbnRfaWRcIikucmVmZXJlbmNlcygoKSA9PiBhY2hpZXZlbWVudHMuaWQpLm5vdE51bGwoKSxcbiAgdW5sb2NrZWRBdDogdGltZXN0YW1wKFwidW5sb2NrZWRfYXRcIikuZGVmYXVsdE5vdygpLm5vdE51bGwoKSxcbn0sICh0YWJsZSkgPT4gKHtcbiAgcGxheWVyQWNoaWV2ZW1lbnRJZHg6IGluZGV4KFwicGxheWVyX2FjaGlldmVtZW50X2lkeFwiKS5vbih0YWJsZS5wbGF5ZXJJZCwgdGFibGUuYWNoaWV2ZW1lbnRJZCksXG59KSk7XG5cbmV4cG9ydCBjb25zdCBpbnNlcnRQbGF5ZXJTY2hlbWEgPSBjcmVhdGVJbnNlcnRTY2hlbWEocGxheWVycyk7XG5leHBvcnQgY29uc3Qgc2VsZWN0UGxheWVyU2NoZW1hID0gY3JlYXRlU2VsZWN0U2NoZW1hKHBsYXllcnMpO1xuZXhwb3J0IGNvbnN0IGluc2VydE1hdGNoU2NoZW1hID0gY3JlYXRlSW5zZXJ0U2NoZW1hKG1hdGNoZXMpO1xuZXhwb3J0IGNvbnN0IHNlbGVjdE1hdGNoU2NoZW1hID0gY3JlYXRlU2VsZWN0U2NoZW1hKG1hdGNoZXMpO1xuZXhwb3J0IGNvbnN0IGluc2VydEFjaGlldmVtZW50U2NoZW1hID0gY3JlYXRlSW5zZXJ0U2NoZW1hKGFjaGlldmVtZW50cyk7XG5leHBvcnQgY29uc3Qgc2VsZWN0QWNoaWV2ZW1lbnRTY2hlbWEgPSBjcmVhdGVTZWxlY3RTY2hlbWEoYWNoaWV2ZW1lbnRzKTtcbmV4cG9ydCBjb25zdCBpbnNlcnRQbGF5ZXJBY2hpZXZlbWVudFNjaGVtYSA9IGNyZWF0ZUluc2VydFNjaGVtYShwbGF5ZXJBY2hpZXZlbWVudHMpO1xuZXhwb3J0IGNvbnN0IHNlbGVjdFBsYXllckFjaGlldmVtZW50U2NoZW1hID0gY3JlYXRlU2VsZWN0U2NoZW1hKHBsYXllckFjaGlldmVtZW50cyk7XG5cbmV4cG9ydCB0eXBlIFBsYXllciA9IHR5cGVvZiBwbGF5ZXJzLiRpbmZlclNlbGVjdDtcbmV4cG9ydCB0eXBlIE5ld1BsYXllciA9IHR5cGVvZiBwbGF5ZXJzLiRpbmZlckluc2VydDtcbmV4cG9ydCB0eXBlIE1hdGNoID0gdHlwZW9mIG1hdGNoZXMuJGluZmVyU2VsZWN0O1xuZXhwb3J0IHR5cGUgTmV3TWF0Y2ggPSB0eXBlb2YgbWF0Y2hlcy4kaW5mZXJJbnNlcnQ7XG5leHBvcnQgdHlwZSBBY2hpZXZlbWVudCA9IHR5cGVvZiBhY2hpZXZlbWVudHMuJGluZmVyU2VsZWN0O1xuZXhwb3J0IHR5cGUgTmV3QWNoaWV2ZW1lbnQgPSB0eXBlb2YgYWNoaWV2ZW1lbnRzLiRpbmZlckluc2VydDtcbmV4cG9ydCB0eXBlIFBsYXllckFjaGlldmVtZW50ID0gdHlwZW9mIHBsYXllckFjaGlldmVtZW50cy4kaW5mZXJTZWxlY3Q7XG5leHBvcnQgdHlwZSBOZXdQbGF5ZXJBY2hpZXZlbWVudCA9IHR5cGVvZiBwbGF5ZXJBY2hpZXZlbWVudHMuJGluZmVySW5zZXJ0OyJdLCJuYW1lcyI6WyJwZ1RhYmxlIiwidGV4dCIsInNlcmlhbCIsImludGVnZXIiLCJ0aW1lc3RhbXAiLCJpbmRleCIsImNyZWF0ZUluc2VydFNjaGVtYSIsImNyZWF0ZVNlbGVjdFNjaGVtYSIsInBsYXllcnMiLCJpZCIsInByaW1hcnlLZXkiLCJuYW1lIiwibm90TnVsbCIsInN0YXJ0WWVhciIsImNyZWF0ZWRBdCIsImRlZmF1bHROb3ciLCJtYXRjaGVzIiwidGVhbU9uZVBsYXllck9uZUlkIiwicmVmZXJlbmNlcyIsInRlYW1PbmVQbGF5ZXJUd29JZCIsInRlYW1PbmVQbGF5ZXJUaHJlZUlkIiwidGVhbVR3b1BsYXllck9uZUlkIiwidGVhbVR3b1BsYXllclR3b0lkIiwidGVhbVR3b1BsYXllclRocmVlSWQiLCJ0ZWFtT25lR2FtZXNXb24iLCJ0ZWFtVHdvR2FtZXNXb24iLCJkYXRlIiwidGFibGUiLCJ0ZWFtT25lUGxheWVyT25lSWR4Iiwib24iLCJ0ZWFtT25lUGxheWVyVHdvSWR4IiwidGVhbU9uZVBsYXllclRocmVlSWR4IiwidGVhbVR3b1BsYXllck9uZUlkeCIsInRlYW1Ud29QbGF5ZXJUd29JZHgiLCJ0ZWFtVHdvUGxheWVyVGhyZWVJZHgiLCJhY2hpZXZlbWVudHMiLCJkZXNjcmlwdGlvbiIsImljb24iLCJjb25kaXRpb24iLCJwbGF5ZXJBY2hpZXZlbWVudHMiLCJwbGF5ZXJJZCIsImFjaGlldmVtZW50SWQiLCJ1bmxvY2tlZEF0IiwicGxheWVyQWNoaWV2ZW1lbnRJZHgiLCJpbnNlcnRQbGF5ZXJTY2hlbWEiLCJzZWxlY3RQbGF5ZXJTY2hlbWEiLCJpbnNlcnRNYXRjaFNjaGVtYSIsInNlbGVjdE1hdGNoU2NoZW1hIiwiaW5zZXJ0QWNoaWV2ZW1lbnRTY2hlbWEiLCJzZWxlY3RBY2hpZXZlbWVudFNjaGVtYSIsImluc2VydFBsYXllckFjaGlldmVtZW50U2NoZW1hIiwic2VsZWN0UGxheWVyQWNoaWV2ZW1lbnRTY2hlbWEiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./db/schema.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_runner_workspace_app_api_trends_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/trends/route.ts */ \"(rsc)/./app/api/trends/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/trends/route\",\n        pathname: \"/api/trends\",\n        filename: \"route\",\n        bundlePath: \"app/api/trends/route\"\n    },\n    resolvedPagePath: \"/home/runner/workspace/app/api/trends/route.ts\",\n    nextConfigOutput,\n    userland: _home_runner_workspace_app_api_trends_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ0cmVuZHMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnRyZW5kcyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnRyZW5kcyUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDRjtBQUMzRTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3RyZW5kcy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3RyZW5kc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvdHJlbmRzL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/drizzle-orm","vendor-chunks/ws","vendor-chunks/date-fns","vendor-chunks/node-gyp-build","vendor-chunks/bufferutil","vendor-chunks/zod","vendor-chunks/drizzle-zod","vendor-chunks/@neondatabase"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();