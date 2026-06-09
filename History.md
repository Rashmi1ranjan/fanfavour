# 7.0.1/ 01-05-2026
- Improved error messages for logging

# 7.0.0/ 30-04-2026
- Added FF SSO token generation logic and store the tokens in the DB ([#987](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/987))

# 6.1.34/ 13-04-2026
- Setup docker for local environment ([#976](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/976))
- Added check for domain when fetching user amount spent for sticky.io and forumpay

# 6.1.33/ 06-03-2026
- Created API to store user data

# 6.1.32/ 16-02-2026
- Added domain and subscription status in the top spending users model

# 6.1.31/ 13-02-2026
- Created new API to store the data for top 50 spending users

# 6.1.30/ 07-01-2026
- Added date filter in the link tracking analytics page

# 6.1.29/ 02-01-2026
- Added link tracking analytics sync events API and show it in the table ([#993](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/993))

# 6.1.28/ 23-12-2025
- Add the MFA settings page for link referral users

# 6.1.27/ 23-12-2025
- Added support to show all domain referral history ([#988](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/988))
- Added support to create and login link tracking referral user ([#991](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/991))

# 6.1.26/ 27-11-2025
- Added support to add All referral option in the website referral history  ([#985](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/985))
- Added Link Tracking Referral Daily Earning Report Page  ([#977](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/977))

# 6.1.25/ 24-11-2025
- Get the referral links from the website instead of the report
- Update referral key in the forumpay transaction  ([#982](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/982))

# 6.1.24/ 21-11-2025
- Improved response checking 

# 6.1.23/ 21-11-2025
- Added page to add link tracking referral ([#970](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/970))
- Added referral key in the sticky.io transaction report ([#971](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/971))
- Added referral key in the wallet transactions ([#972](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/972))
- Added referral key in CCBill transactions ([#975](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/975))
- Added referral daily earning report in the sticky.io payment gateway ([#973](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/973))
- Feature/forumpay daily earning ([#978](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/978))
- Added support to count referral daily earning in the ccbill payment gateway ([#974](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/974))

# 6.1.22/ 29-10-2025
- Added payload for API limiter logs
- Added SendGrid mail template ID in the MySQL database ([#966](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/966))

# 6.1.21/ 12-09-2025
- Update API Static token

# 6.1.20/ 05-09-2025
- Get model website id ([#962](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/962))

# 6.1.19/ 01-09-2025
- Encode email while getting user data from the website ([#960](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/960))

# 6.1.18/ 27-08-2025
- Fetch sticky.io and ccbill last 24 hour transaction and total earning according to MST timezone ([#958](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/958))

# 6.1.17/ 14-08-2025
- Updated API to adjust display order if the same display order is found

# 6.1.16/ 11-08-2025
- Sorted the model list by display order
- Add support to remove the model from Fan Favour ([#955](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/955))

# 6.1.15/ 11-08-2025
- Added support to mark multiple models as featured models

# 6.1.14/ 06-08-2025
- Added support for managing the fan favour model list ([#944](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/944))
- Added support to change the featured model on the fan favour website ([#944](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/944))
- Added support to change the featured model text ([#944](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/944))

# 6.1.13/ 06-06-2025
- Get the stopped website list for restoring website db ([#940](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/940))

# 6.1.12/ 03-06-2025
- Created an API and a collection to store coupon data

# 6.1.11/ 05-05-2025
- Show email statistics of the last 7 days ([#937](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/937))

# 6.1.10/ 01-05-2025
- Store blog and mass message counts
- Added support for displaying email statistics in both chart and table views, with filters for date range and domain ([#935](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/935))

# 6.1.9/ 29-04-2025
- Store SendGrid email webhook actions data in MySQL database ([#933](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/933))

# 6.1.8/ 21-04-2025
- Created an API to check if the domain is active or not ([#931](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/931))

# 6.1.7/ 03-03-2025
- Send website_id 1 if user is present on single website
- Remove extra semicolon & use single quote ([#834](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/834))
- Fixed an issue where pagination was not working as expected with filters on the daily earning report page

# 6.1.6/ 13-02-2025
- Send model website ID to improve the UX when changing pages ([#921](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/921))
- Get the non-universal single website ([#924](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/924))
- Improved UI colors for dark mode
- Only get count of live websites

# 6.1.5/ 06-02-2025
- Created API to store new paying user count data

# 6.1.4/ 06-02-2025
- Update css to show text color on react-select text box
- Created API to store paying users analytics count

# 6.1.3/ 08-01-2025
- Get the universal merge domain model details ([#918](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/918))
- Created API to store active paying subscribers count

# 6.1.2/ 24-12-2024
- Removed currency format from CCBill fees
- Fixed issue with suspicious user logs not visible
- Updated Bootstrap to the latest version ([#916](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/916))

# 6.1.1/ 01-10-2024
- Fix an issue that shows a duplicate domain in the monthly earning report ([#911](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/911))
- Added removed stopped websites support monthly earning reports ([#912](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/912))

# 6.1.0/ 12-09-2024
- Update react, mobx, and typescript ([#908](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/908))
- Improved code to remove stopped websites for the referral role
- Added index
- Fixed warnings for invalid time format when using referral monthly earning report section
- Removed unwanted code and console.log

# 6.0.18/ 20-08-2024
- Block user by card name ([#889](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/889))

# 6.0.17/ 06-08-2024
- Added pages for video server monitoring ([#876](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/876))

# 6.0.16/ 06-08-2024
- Fixed issue where a card is not marked as primary if used by another non-universal user

# 6.0.15/ 01-08-2024
- Sent correct card id when removing card

# 6.0.14/ 29-07-2024
- Fixed issue with delete card for non-universal user ([#899](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/899))

# 6.0.13/ 25-07-2024
- Update yarn to v4 ([#897](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/897))
- Fixed issue with multiple cards showing to users after universal login

# 6.0.12/ 17-07-2024
- Fixed issue where error earnings were considered in the universal login analytics

# 6.0.11/ 11-07-2024
- Flag transaction as universal and display a graph to show the earnings ([#894](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/894))

# 6.0.10/ 26-06-2024
- Removed non-universal users ready to merge query
- Added index

# 6.0.9/ 24-06-2024
- Block & delete user universal login ([#826](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/826))
- Set Reset password popup reminder for Universal login ([#860](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/860))

# 6.0.8/ 10-06-2024
- Fixed issue where wallet balance was not merged for single website user

# 6.0.7/ 05-06-2024
- Don't show universally blocked users count in statistics ([#884](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/884))
- Show non-universal users present on multiple sites ([#885](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/885))
- Fix issue where View Popup Intro and View Content action disable ([#886](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/886))

# 6.0.6/ 29-05-2024
- Universal login statistics ([#879](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/879))
- Fixed the issue where the View Popup Intro and View Content buttons were disabled even when content was present ([#880](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/880))
- Update Influencer help page UI ([#881](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/881))
- Add filter in 'check website status' page ([#882](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/882))

# 6.0.5/ 24-05-2024
- Fix the 'Edit action' of the API limit configuration page ([#877](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/877))
- Fixed issue where the status filter did not show the filtered value after page change ([#871](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/871))
- Fix warning of assign types in store files ([#838](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/838), [#839](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/839), [#840](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/840))
- Created API to store the model unread count data

# 6.0.4/ 15-05-2024
- Prevent null values stored in the database for Universal Users ([#868](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/868))
- Fix the issue where 'body' was undefined when receiving email webhooks ([#869](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/869))
- Change universal login API's method GET to POST ([#872](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/872))
- Enhance error response in universal login API's ([#865](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/865))
- Fix Issues in update non-universal user primary card ([#875](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/875))

# 6.0.3/ 10-05-2024
- Improved conditions for checking primary card in Universal Login
- Support for multi-select on the 'status' filter of Websites page ([#867](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/867))

# 6.0.2/ 09-05-2024
- Video queue UI update ([#864](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/864))
- Add support to search cards using the Card Holder Name on the User Card List page ([#862](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/862))
- Add Today button in the date picker on the add website referral page ([#816](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/816))
- Fixed conditions after `exists()` query in Universal login
- Fixed an issue where default_payment_method was not set correctly in some cases
- Added indexes

# 6.0.1/ 08-05-2024
- Fixed issue while getting card details after mongoose version update

# 6.0.0/ 07-05-2024
- Updated forumpay sandbox URL and credentials
- Update mongoose version from 5.12.12 to 8.3.1 ([#843](https://bitbucket.org/yogsrayo/premium-content-platform-web-services/pull-requests/843))
