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
exports.id = "app/api/achievements/player/[playerId]/route";
exports.ids = ["app/api/achievements/player/[playerId]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/achievements/player/[playerId]/route.ts":
/*!*********************************************************!*\
  !*** ./app/api/achievements/player/[playerId]/route.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n// Mock achievements as fallback data\nconst mockAchievements = [\n    {\n        id: 1,\n        name: 'First Victory',\n        description: 'Win your first match',\n        icon: '🏆',\n        unlockedAt: '2023-01-15T12:34:56Z'\n    },\n    {\n        id: 2,\n        name: 'Win Streak',\n        description: 'Win 3 matches in a row',\n        icon: '🔥',\n        unlockedAt: '2023-02-10T15:30:00Z'\n    },\n    {\n        id: 3,\n        name: 'Team Player',\n        description: 'Play with 5 different teammates',\n        icon: '👥',\n        unlockedAt: '2023-03-05T14:22:33Z'\n    },\n    {\n        id: 4,\n        name: 'Veteran',\n        description: 'Play 50 matches',\n        icon: '🎖️',\n        unlockedAt: null\n    },\n    {\n        id: 5,\n        name: 'Comeback King',\n        description: 'Win a match after being down by 5 points',\n        icon: '👑',\n        unlockedAt: null\n    }\n];\nasync function GET(request, { params }) {\n    const playerId = parseInt(params.playerId);\n    if (isNaN(playerId)) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Invalid player ID'\n        }, {\n            status: 400\n        });\n    }\n    try {\n        // Server-side fetch from the original site\n        const response = await fetch(`https://cfa-wally-stats.replit.app/api/achievements/player/${playerId}`, {\n            method: 'GET',\n            headers: {\n                'Accept': 'application/json'\n            },\n            cache: 'no-store' // Disable caching for now\n        });\n        if (!response.ok) {\n            throw new Error(`API responded with status: ${response.status}`);\n        }\n        const data = await response.json();\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(data);\n    } catch (error) {\n        console.error(`Error fetching achievements for player ${playerId}:`, error);\n        // Return mock achievements as fallback\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(mockAchievements);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FjaGlldmVtZW50cy9wbGF5ZXIvW3BsYXllcklkXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUEwQztBQUUxQztBQUNBLE1BQU1DLGdCQUFnQixHQUFHO0lBQ3ZCO1FBQ0VDLEVBQUUsRUFBRSxDQUFDO1FBQ0xDLElBQUksRUFBRSxlQUFlO1FBQ3JCQyxXQUFXLEVBQUUsc0JBQXNCO1FBQ25DQyxJQUFJLEVBQUUsSUFBSTtRQUNWQyxVQUFVLEVBQUU7SUFDZCxDQUFDO0lBQ0Q7UUFDRUosRUFBRSxFQUFFLENBQUM7UUFDTEMsSUFBSSxFQUFFLFlBQVk7UUFDbEJDLFdBQVcsRUFBRSx3QkFBd0I7UUFDckNDLElBQUksRUFBRSxJQUFJO1FBQ1ZDLFVBQVUsRUFBRTtJQUNkLENBQUM7SUFDRDtRQUNFSixFQUFFLEVBQUUsQ0FBQztRQUNMQyxJQUFJLEVBQUUsYUFBYTtRQUNuQkMsV0FBVyxFQUFFLGlDQUFpQztRQUM5Q0MsSUFBSSxFQUFFLElBQUk7UUFDVkMsVUFBVSxFQUFFO0lBQ2QsQ0FBQztJQUNEO1FBQ0VKLEVBQUUsRUFBRSxDQUFDO1FBQ0xDLElBQUksRUFBRSxTQUFTO1FBQ2ZDLFdBQVcsRUFBRSxpQkFBaUI7UUFDOUJDLElBQUksRUFBRSxLQUFLO1FBQ1hDLFVBQVUsRUFBRTtJQUNkLENBQUM7SUFDRDtRQUNFSixFQUFFLEVBQUUsQ0FBQztRQUNMQyxJQUFJLEVBQUUsZUFBZTtRQUNyQkMsV0FBVyxFQUFFLDBDQUEwQztRQUN2REMsSUFBSSxFQUFFLElBQUk7UUFDVkMsVUFBVSxFQUFFO0lBQ2QsQ0FBQztDQUNGO0FBRU0sZUFBZUMsR0FBR0EsQ0FDdkJDLE9BQWdCLEVBQ2hCLEVBQUVDLE1BQUFBLEVBQTBDLEVBQzVDO0lBQ0EsTUFBTUMsUUFBUSxHQUFHQyxRQUFRLENBQUNGLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDO0lBRTFDLElBQUlFLEtBQUssQ0FBQ0YsUUFBUSxDQUFDLEVBQUU7UUFDbkIsT0FBT1YscURBQVksQ0FBQ2EsSUFBSSxDQUN0QjtZQUFFQyxLQUFLLEVBQUU7UUFBb0IsQ0FBQyxFQUM5QjtZQUFFQyxNQUFNLEVBQUU7UUFBSSxDQUNoQixDQUFDO0lBQ0g7SUFFQSxJQUFJO1FBQ0Y7UUFDQSxNQUFNQyxRQUFRLEdBQUcsTUFBTUMsS0FBSyxDQUFFLDhEQUE2RFAsUUFBUyxFQUFDLEVBQUU7WUFDckdRLE1BQU0sRUFBRSxLQUFLO1lBQ2JDLE9BQU8sRUFBRTtnQkFDUCxRQUFRLEVBQUU7WUFDWixDQUFDO1lBQ0RDLEtBQUssRUFBRSxVQUFVLENBQUM7UUFDcEIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxDQUFDSixRQUFRLENBQUNLLEVBQUUsRUFBRTtZQUNoQixNQUFNLElBQUlDLEtBQUssQ0FBRSw4QkFBNkJOLFFBQVEsQ0FBQ0QsTUFBTyxFQUFDLENBQUM7UUFDbEU7UUFFQSxNQUFNUSxJQUFJLEdBQUcsTUFBTVAsUUFBUSxDQUFDSCxJQUFJLENBQUMsQ0FBQztRQUNsQyxPQUFPYixxREFBWSxDQUFDYSxJQUFJLENBQUNVLElBQUksQ0FBQztJQUNoQyxDQUFDLENBQUMsT0FBT1QsS0FBSyxFQUFFO1FBQ2RVLE9BQU8sQ0FBQ1YsS0FBSyxDQUFFLDBDQUF5Q0osUUFBUyxHQUFFLEVBQUVJLEtBQUssQ0FBQztRQUMzRTtRQUNBLE9BQU9kLHFEQUFZLENBQUNhLElBQUksQ0FBQ1osZ0JBQWdCLENBQUM7SUFDNUM7QUFDRiIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL2FjaGlldmVtZW50cy9wbGF5ZXIvW3BsYXllcklkXS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcic7XG5cbi8vIE1vY2sgYWNoaWV2ZW1lbnRzIGFzIGZhbGxiYWNrIGRhdGFcbmNvbnN0IG1vY2tBY2hpZXZlbWVudHMgPSBbXG4gIHtcbiAgICBpZDogMSxcbiAgICBuYW1lOiAnRmlyc3QgVmljdG9yeScsXG4gICAgZGVzY3JpcHRpb246ICdXaW4geW91ciBmaXJzdCBtYXRjaCcsXG4gICAgaWNvbjogJ/Cfj4YnLFxuICAgIHVubG9ja2VkQXQ6ICcyMDIzLTAxLTE1VDEyOjM0OjU2WidcbiAgfSxcbiAge1xuICAgIGlkOiAyLFxuICAgIG5hbWU6ICdXaW4gU3RyZWFrJyxcbiAgICBkZXNjcmlwdGlvbjogJ1dpbiAzIG1hdGNoZXMgaW4gYSByb3cnLFxuICAgIGljb246ICfwn5SlJyxcbiAgICB1bmxvY2tlZEF0OiAnMjAyMy0wMi0xMFQxNTozMDowMFonXG4gIH0sXG4gIHtcbiAgICBpZDogMyxcbiAgICBuYW1lOiAnVGVhbSBQbGF5ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnUGxheSB3aXRoIDUgZGlmZmVyZW50IHRlYW1tYXRlcycsXG4gICAgaWNvbjogJ/CfkaUnLFxuICAgIHVubG9ja2VkQXQ6ICcyMDIzLTAzLTA1VDE0OjIyOjMzWidcbiAgfSxcbiAge1xuICAgIGlkOiA0LFxuICAgIG5hbWU6ICdWZXRlcmFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ1BsYXkgNTAgbWF0Y2hlcycsXG4gICAgaWNvbjogJ/CfjpbvuI8nLFxuICAgIHVubG9ja2VkQXQ6IG51bGxcbiAgfSxcbiAge1xuICAgIGlkOiA1LFxuICAgIG5hbWU6ICdDb21lYmFjayBLaW5nJyxcbiAgICBkZXNjcmlwdGlvbjogJ1dpbiBhIG1hdGNoIGFmdGVyIGJlaW5nIGRvd24gYnkgNSBwb2ludHMnLFxuICAgIGljb246ICfwn5GRJyxcbiAgICB1bmxvY2tlZEF0OiBudWxsXG4gIH1cbl07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiB7IHBsYXllcklkOiBzdHJpbmcgfSB9XG4pIHtcbiAgY29uc3QgcGxheWVySWQgPSBwYXJzZUludChwYXJhbXMucGxheWVySWQpO1xuXG4gIGlmIChpc05hTihwbGF5ZXJJZCkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiAnSW52YWxpZCBwbGF5ZXIgSUQnIH0sXG4gICAgICB7IHN0YXR1czogNDAwIH1cbiAgICApO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBTZXJ2ZXItc2lkZSBmZXRjaCBmcm9tIHRoZSBvcmlnaW5hbCBzaXRlXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9jZmEtd2FsbHktc3RhdHMucmVwbGl0LmFwcC9hcGkvYWNoaWV2ZW1lbnRzL3BsYXllci8ke3BsYXllcklkfWAsIHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgY2FjaGU6ICduby1zdG9yZScgLy8gRGlzYWJsZSBjYWNoaW5nIGZvciBub3dcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlc3BvbmRlZCB3aXRoIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oZGF0YSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgZmV0Y2hpbmcgYWNoaWV2ZW1lbnRzIGZvciBwbGF5ZXIgJHtwbGF5ZXJJZH06YCwgZXJyb3IpO1xuICAgIC8vIFJldHVybiBtb2NrIGFjaGlldmVtZW50cyBhcyBmYWxsYmFja1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihtb2NrQWNoaWV2ZW1lbnRzKTtcbiAgfVxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJtb2NrQWNoaWV2ZW1lbnRzIiwiaWQiLCJuYW1lIiwiZGVzY3JpcHRpb24iLCJpY29uIiwidW5sb2NrZWRBdCIsIkdFVCIsInJlcXVlc3QiLCJwYXJhbXMiLCJwbGF5ZXJJZCIsInBhcnNlSW50IiwiaXNOYU4iLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJyZXNwb25zZSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImNhY2hlIiwib2siLCJFcnJvciIsImRhdGEiLCJjb25zb2xlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/achievements/player/[playerId]/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_runner_workspace_app_api_achievements_player_playerId_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/achievements/player/[playerId]/route.ts */ \"(rsc)/./app/api/achievements/player/[playerId]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/achievements/player/[playerId]/route\",\n        pathname: \"/api/achievements/player/[playerId]\",\n        filename: \"route\",\n        bundlePath: \"app/api/achievements/player/[playerId]/route\"\n    },\n    resolvedPagePath: \"/home/runner/workspace/app/api/achievements/player/[playerId]/route.ts\",\n    nextConfigOutput,\n    userland: _home_runner_workspace_app_api_achievements_player_playerId_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhY2hpZXZlbWVudHMlMkZwbGF5ZXIlMkYlNUJwbGF5ZXJJZCU1RCUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYWNoaWV2ZW1lbnRzJTJGcGxheWVyJTJGJTVCcGxheWVySWQlNUQlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhY2hpZXZlbWVudHMlMkZwbGF5ZXIlMkYlNUJwbGF5ZXJJZCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDc0I7QUFDbkc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF1cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2FjaGlldmVtZW50cy9wbGF5ZXIvW3BsYXllcklkXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();