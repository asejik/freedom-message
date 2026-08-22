import assemblyai as aai
import os
import urllib.parse # We added this to clean up the %20 characters

aai.settings.api_key = "85067b2a9a8048bbb46997a504037a02"

output_dir = "/content/drive/MyDrive/Audio_Transcripts"
os.makedirs(output_dir, exist_ok=True)

audio_urls = [
    "https://archive.org/download/clc-2024-sermons/Aligning%20And%20Realigning%20With%20God%27s%20Purpose%204%3B%20Graces%20and%20Giftings%20for%20Your%20Purpose%20%2816-10-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20And%20Realigning%20With%20God%27s%20Purpose%205%3B%20Realignment%20with%20God%27s%20Purpose%20%2820-10-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20And%20Realigning%20With%20God%27s%20Purpose%205%3B%20Realignment%20with%20God%27s%20Purpose%20%2820-10-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20And%20Realigning%20With%20God%27s%20Purpose%206%3B%20Dealing%20with%20Troubles%20%26%20Discouragement%20on%20the%20Path%20of%20God%27s%20Purpose%20%2823-10-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20and%20Realigning%20With%20God%27s%20Purpose%201%3B%20Understanding%20God%27s%20Bias%20and%20Commitment%20on%20Earth%20%2802-10-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20and%20Realigning%20with%20God%27s%20Purpose%207%3B%20Recognizing%20and%20Maximizing%20Vital%20Partnerships%20in%20God%27s%20Master%20Plan%20%2827-10-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20and%20Realigning%20with%20God%27s%20Purpose%207%3B%20Recognizing%20and%20Maximizing%20Vital%20Partnerships%20in%20God%27s%20Master%20Plan%20%2827-10-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Aligning%20and%20Realigning%20with%20God%27s%20Purpose%208%3B%20A%20Recap%20%2830-10-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Believer%27s%20Authority%201%3B%20Power%20%26%20Authority%20%2804-09-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Believer%27s%20Authority%202%3B%20Submission%20To%20Gods%20Word%20%26%20Victory%20Over%20Satan%20%2811-09-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Believer%27s%20Authority%203%3B%20Releasing%20God%27s%20Authority%20over%20Situations%20%2818-09-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Believer%27s%20Authority%204%3B%20Authority%20in%20The%20Name%20of%20Jesus%20%2825-09-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Dealing%20With%20Difficult%20Times%20And%20Emerging%20Victorious%201%3B%20Why%20Do%20Christians%20Suffer%20%2807-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Dealing%20With%20Difficult%20Times%20And%20Emerging%20Victorious%202%3B%20Responding%20to%20Challenges%20%2814-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Dealing%20With%20Difficult%20Times%20And%20Emerging%20Victorious%203%3B%20Steering%20Your%20Life%20Out%20Of%20Adversity%20%2821-02-2024%29%20%281%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Dealing%20With%20Difficult%20Times%20And%20Emerging%20Victorious%203%3B%20Steering%20Your%20Life%20Out%20Of%20Adversity%20%2821-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Dealing%20With%20Difficult%20Times%20And%20Emerging%20Victorious%204%3B%20Creating%20an%20Atmosphere%20for%20Victory%20in%20Challenges%20%2828-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Encounters%20of%20Destiny%201%3B%20Encounters%20of%20Destiny%20%2821-07-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%201%3B%20The%20Anatomy%20of%20an%20Enterprising%20Spirit%20%2803-03-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%201%3B%20The%20Anatomy%20of%20an%20Enterprising%20Spirit%20%2803-03-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%202%3B%20Monetizing%20Your%20Giftings%20%2810-03-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%203%3B%20Driving%20Growth%20In%20Your%20Enterprise%20%2817-03-2024a%29.mp3.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%203%3B%20Driving%20Growth%20In%20Your%20Enterprise%20%2817-03-2024b%29.mp3.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%204%3B%20Proper%20Response%20In%20Difficult%20Times%20In%20Enterprise%20%2824-03-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Enterprise%204%3B%20Proper%20Response%20In%20Difficult%20Times%20In%20Enterprise%20%2824-03-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/FC%202024%20-%20Day%202%3B%20The%20Favour%20of%20The%20Lord%20%2805-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/FC%202024%20-%20Day%203%3B%20Favour%20and%20Love%20%2806-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/FC%202024%20-%20Day%204%3B%20The%20Benefits%20of%20Favour%20%2807-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Father%27s%20Day%20Service%3B%20Fatherhood%20-%20The%20Image%20and%20Voice%20of%20Possibilities%20%2816-06-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Father%27s%20Day%20Service%3B%20Fatherhood%20-%20The%20Image%20and%20Voice%20of%20Possibilities%20%2816-06-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/From%20Righteousness%20To%20Holiness%201%3B%20Righteousness%20and%20Holiness%20%2801-05-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/From%20Righteousness%20To%20Holiness%202%3B%20The%20X-Ray%20Of%20Holiness%20%2808-05-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/From%20Righteousness%20To%20Holiness%203%3B%20Holiness%20and%20Usefulness%20%2815-05-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/From%20Righteousness%20To%20Holiness%204%3B%20The%20Impact%20of%20Holiness%20on%20Your%20Calling%20%2822-05-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/From%20Righteousness%20To%20Holiness%205%3B%20The%20X-Ray%20Of%20Holiness%202%20%2829-05-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Global%20Thanksgiving%3B%20Praise%20With%20Understanding%20%2808-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%201%3B%20Turning%20a%20House%20into%20a%20Home%20%2801-09-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%201%3B%20Turning%20a%20House%20into%20a%20Home%20%2801-09-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%202%3B%20Dealing%20With%20Difficult%20Times%20in%20Marriage%20%2808-09-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%202%3B%20Dealing%20With%20Difficult%20Times%20in%20Marriage%20%2808-09-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%203%3B%20Conflict%20Resolution%20in%20Marriage%20%2815-09-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%203%3B%20Conflict%20Resolution%20in%20Marriage%20%2815-09-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%204%3B%20The%20Thermostat%20of%20a%20Home%20%2822-09-2024a%29%20%281%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%204%3B%20The%20Thermostat%20of%20a%20Home%20%2822-09-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%205%3B%20Healing%20For%20Breaking%20Homes%20%2829-09-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20%26%20Family%205%3B%20Healing%20For%20Breaking%20Homes%20%2829-09-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Homes%2C%20Love%20and%20Family%205%3B%20Healing%20from%20Breaking%20Homes%20-%20Super%20Sunday%20%2829-09-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/IGOSDP%20Day%201%3B%20The%20Blessing%20%2828-03-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/LCAOBW%202024%3B%20From%20Ex%20To%20Next%20-%201st%20Service%20%2811-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/LCAOBW%202024%3B%20From%20Ex%20To%20Next%20-%202nd%20Service%20%2811-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%201%3B%20The%20Debt%20Of%20Honour%20%2802-06-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%202%3B%20The%20Cost%20of%20Honour%20%2805-06-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%203%3B%20Considerations%20for%20Honour%20%2809-06-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%203%3B%20Considerations%20for%20Honour%20%2809-06-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%204%3B%20The%20Tests%20of%20Honour%20%2812-06-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%205%3B%20The%20Reward%20of%20Honour%20%2819-06-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%206%3B%20The%20Honour%20of%20God%20%2823-06-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%206%3B%20The%20Honour%20of%20God%20%2823-06-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%207%3B%20Honour%20for%20Parents%20%2826-06-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%208%3B%20Honour%20For%20Spiritual%20Authority%20%2830-06-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Made%20Of%20Honour%208%3B%20Honour%20For%20Spiritual%20Authority%20%2830-06-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%201%3B%20Why%20You%20Need%20A%20Miracle%20%2805-05-2024a%29%20%281%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%201%3B%20Why%20You%20Need%20A%20Miracle%20%2805-05-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%201%3B%20Why%20You%20Need%20A%20Miracle%20%2805-05-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%202%3B%20Faith%20And%20Expectancy%20%2819-05-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%202%3B%20Faith%20And%20Expectancy%20%2819-05-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%203%3B%20Creating%20an%20Atmosphere%20For%20Daily%20Miracles%20%2826-05-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Miracles%20-%20Living%20Daily%20In%20The%20Power%20Of%20God%203%3B%20Creating%20an%20Atmosphere%20For%20Daily%20Miracles%20%2826-05-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Pre%20IGOSDP%202024%3B%20The%20Right%20Posture%20for%20IGOSDP%20%2827-03-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Pre-Encounter%20Service%3B%20Making%20The%20Most%20of%20Prophetic%20Visitations%20%2801-12-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Pre-Encounter%20Service%3B%20Making%20The%20Most%20of%20Prophetic%20Visitations%20%2801-12-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Pre-Encounter%3B%20The%20Assignments%20of%20a%20Teaching%20Priest%20%2801-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20For%20The%20New%20Year%201%3B%20The%20Importance%20of%20Preparation%20%2815-12-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20For%20The%20New%20Year%201%3B%20The%20Importance%20of%20Preparation%20%2815-12-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20For%20The%20New%20Year%202%3B%20What%20to%20Know%20About%20Preparation%20%2818-12-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20For%20The%20New%20Year%203%3B%20Areas%20Of%20Preparation%20for%20the%20Year%20%2822-12-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20For%20The%20New%20Year%203%3B%20Areas%20Of%20Preparation%20for%20the%20Year%20%2822-12-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Preparing%20for%20the%20New%20Year%201%20-%202nd%20Service%20%2815-12-24%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Relationships%3B%20God%27s%20Vital%20Factor%20in%20the%20Making%20of%20Men%201%20-%20Building%20Solid%20Relationships%20-%201st%20Service%20%2804-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Relationships%3B%20God%27s%20Vital%20Factor%20in%20the%20Making%20of%20Men%201%20-%20Building%20Solid%20Relationships%20-%202nd%20Service%20%2804-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Relationships%3B%20God%27s%20Vital%20Factor%20in%20the%20Making%20of%20Men%202%3B%20%20Vital%20Laws%20Underguarding%20Relationships%20of%20Grace%20-%202nd%20Service%20%2818-02-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%204%3B%20Prayers%20That%20Receives%20Answers%20%2813-10-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%205%3B%20Understanding%20Giving%3B%20The%20Sacrifice%20of%20your%20Labour%20%2817-11-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%205%3B%20Understanding%20Giving%3B%20The%20Sacrifice%20of%20your%20Labour%20%2817-11-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%206%3B%20The%20Rules%20of%20Answered%20Prayers%20%2820-11-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%207%3B%20Understanding%20Consecration%20-%20The%20Sacrifice%20Of%20Your%20Living%20%2824-0-11-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%207%3B%20Understanding%20Consecration%20-%20The%20Sacrifice%20Of%20Your%20Living%20%2824-0-11-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%208%3B%20Prayer%20and%20Thanksgiving%20%2827-11-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%3B%20Understanding%20Fasting%20%2810-11-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%3B%20Understanding%20Fasting%20%2810-11-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%3B%20Understanding%20Sacrifices%20-%20A%20Voice%20in%20The%20Heavenlies%20%2803-11-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%3B%20Understanding%20Sacrifices%20-%20A%20Voice%20in%20The%20Heavenlies%20%2803-11-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Sacrifices%20-%20Pathway%20To%20Glory%3B%20Vital%20Elements%20of%20Sacrifice%20%2807-11-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%201%3B%20The%20Reason%20for%20Salvation%20%2803-07-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%202%3B%20Grace%20and%20Faith%2C%20God%27s%20Recommendation%20for%20Salvation%20%2810-07-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%203%3B%20The%20Gospel%20And%20Salvation%20%2817-07-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%204%3B%20The%20Goal%20and%20Benefits%20of%20Salvation%20%2824-07-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%205%3B%20Soul%20Salvation%20%2807-08-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%206%3B%20Repentance%20%26%20Appropriation%20%2814-08-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%207%3B%20The%20Eternal%20Security%20of%20a%20Believer%20%2821-08-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Salvation%20-%20The%20Total%20Package%208%3B%20Saved%20Unto%20Good%20Works%20%2828-08-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Special%20Singles%20Service%3B%20Laws%20of%20Attraction%20%2825-02-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Special%20Sunday%3B%20Securing%20Our%20Homes%20%2806-10-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Special%20Sunday%3B%20Securing%20Our%20Homes%20%2806-10-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%201%3B%20The%20Required%20Change%20and%20The%20Necessary%20Willingness%20%2807-07-2024b%29%20%281%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%201%3B%20The%20Required%20Change%20and%20The%20Necessary%20Willingness%20%2807-07-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%202%3B%20Identifying%20Areas%20of%20Change%20and%20the%20Growth%20Steps%20%2814-07-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%202%3B%20Identifying%20Areas%20of%20Change%20and%20the%20Growth%20Steps%20%2814-07-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%204%3B%20Maximising%20Relationship%20with%20Mentors%20%2811-08-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%204%3B%20Maximising%20Relationship%20with%20Mentors%20%2811-08-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%205%3B%20Capacity%20Development%20%2818-08-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%205%3B%20Capacity%20Development%2818-08-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%206%3B%20Embracing%20Change%20%2825-08-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Becoming%206%3B%20Embracing%20Change%20%2825-08-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Divine%20Life%20and%20Its%20Rules%20of%20Engagements%201%3B%20The%20Divine%20Life%20%2806-03-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Divine%20Life%20and%20Its%20Rules%20of%20Engagements%202%3B%20Rules%20of%20Engagement%20for%20The%20Divine%20Life%201%20%2813-03-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Divine%20Life%20and%20Its%20Rules%20of%20Engagements%203%3B%20The%20Hybrid%20Life%20Of%20The%20New%20Man%20%2820-03-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%201%3B%20Understanding%20the%20Seed%20Principle%20%2807-04-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%202%3B%20Understanding%20the%20Seed%20Principle%202%20%2814-04-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%202%3B%20Understanding%20the%20Seed%20Principle%202%20%2814-04-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%203%3B%20The%20Life%20Cycle%20of%20A%20Seed%20%2821-04-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%203%3B%20The%20Life%20Cycle%20of%20A%20Seed%20%2821-04-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%204%3B%20Patience%20A%20Vital%20Factor%20In%20The%20Seed%20Principle%20%2828-04-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Law%20of%20Rest%204%3B%20Patience%20A%20Vital%20Factor%20In%20The%20Seed%20Principle%20%2828-04-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Total%20Woman%3B%20Raising%20A%20Wholesome%20Family%20%2812-05-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/The%20Total%20Woman%3B%20Raising%20A%20Wholesome%20Family%20%2812-05-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Tongues%2C%20Interpretation%20%26%20Application%201%3B%20The%20Basics%20of%20%20Tongues%20%2803-04-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Tongues%2C%20Interpretation%20%26%20Application%202%3B%20The%20Basics%20of%20Tongues%20-%20Part%202%20%20%2810-04-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Tongues%2C%20Interpretation%20%26%20Application%203%3B%20Interpretation%20Through%20Application%20%2817-04-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Tongues%2C%20Interpretation%20%26%20Application%204%3B%20Ministering%20to%20the%20Lord%20in%20Other%20Tongues%20%2824-04-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%201%3B%20Scope%20and%20Expressions%20of%20God%27s%20Grace%20%2803-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%202%3B%20Understanding%20Grace%20-%201st%20Service%20%2807-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%202%3B%20Understanding%20Grace%20-%202nd%20Service%20%2807-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%203%3B%20Foundation%20of%20Grace%20%2810-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%204%3B%20Factors%20of%20Grace%201%20-%201st%20Service%20%2814-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%204%3B%20Factors%20of%20Grace%201%20-%202nd%20Service%20%2814-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%205%3B%20Factors%20Of%20Grace%202%20%2817-1-2024%29%20%281%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%206%3B%20Factors%20Of%20Grace%203%20-1st%20Service%20%2821-1-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%206%3B%20Factors%20Of%20Grace%203%20-2nd%20Service%20%2821-1-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%207%3B%20Christian%20Humility%20%2824-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%208%3B%20Factors%20of%20Grace%20%28Part%204%29%20-%201st%20Service%20%2828-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%208%3B%20Factors%20of%20Grace%20%28Part%204%29%20-%202nd%20Service%20%2828-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Unlimited%20Grace%209%3B%20Grace%20For%20Prosperity%20%2831-01-2024%29.mp3",
    "https://archive.org/download/clc-2024-sermons/Vow%20Renewal%202024%3B%20A%20Household%20For%20The%20Lord%20%2825-02-2024b%29.mp3",
    "https://archive.org/download/clc-2024-sermons/What%20Easter%20Represents%20%2831-03-2024a%29.mp3",
    "https://archive.org/download/clc-2024-sermons/What%20Easter%20Represents%20%2831-03-2024b%29.mp3"
]

print(f"Starting batch transcription for {len(audio_urls)} files...")

config = aai.TranscriptionConfig(speaker_labels=False, format_text=True)
transcriber = aai.Transcriber()
transcripts = transcriber.transcribe_group(audio_urls, config=config)

# We added 'enumerate' here to count each file starting at 1
for index, transcript in enumerate(transcripts, start=1):
    if transcript.status == aai.TranscriptStatus.error:
        print(f"Error on {transcript.audio_url}: {transcript.error}")
        continue

    # 1. Extract the raw filename from the URL
    raw_name = transcript.audio_url.split('/')[-1].split('?')[0]

    # 2. Decode the %20 (spaces) and %27 (apostrophes) into normal text
    clean_name = urllib.parse.unquote(raw_name)

    # 3. Strip the .mp3/.wav extension off the end if it exists
    if "." in clean_name:
        clean_name = clean_name.rsplit(".", 1)[0]

    # 4. Prepend the number so it is guaranteed unique (e.g., 1_Aligning_And_Realigning.txt)
    final_filename = f"{index}_{clean_name}.txt"
    file_path = os.path.join(output_dir, final_filename)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(transcript.text)

    print(f"Saved: {final_filename}")

print("Batch complete! Check your Google Drive.")
