import { Advisor } from '../types/Advisor'

// Helper to get a random element
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Predefined advisors with historical data
const ADVISOR_DATA: Omit<Advisor, 'location' | 'ownerId'>[] = [
    // Philosophers / Thinkers
    {
        id: 'advisor_laozi',
        name: '老子',
        level: 5,
        specialAbilities: ['Daoism', 'Harmony', 'Reduce Unrest'],
        biography: 'Founder of Daoism, author of the Tao Te Ching. Advocates for naturalness, simplicity, and spontaneity. "The Way that can be told is not the eternal Way."',
        portrait: '/portraits/laozi.png'
    },
    {
        id: 'advisor_zhuangzi',
        name: '庄子',
        level: 4,
        specialAbilities: ['Daoism', 'Freedom', 'Philosophy'],
        biography: 'A pivotal figure in Daoism known for his skeptical philosophy and literary masterpiece, the Zhuangzi. Famous for the "Butterfly Dream".',
        portrait: '/portraits/zhuangzi.png'
    },
    {
        id: 'advisor_liezi',
        name: '列子',
        level: 3,
        specialAbilities: ['Daoism', 'Metaphysics'],
        biography: 'A Daoist philosopher who emphasized the impermanence of life and the acceptance of death.',
        portrait: '/portraits/liezi.png'
    },
    {
        id: 'advisor_kongzi',
        name: '孔子',
        level: 5,
        specialAbilities: ['Confucianism', 'Education', 'Order'],
        biography: 'Confucius, the most influential philosopher in Chinese history. Emphasized personal and governmental morality, correctness of social relationships, justice, and sincerity.',
        portrait: '/portraits/kongzi.png'
    },
    {
        id: 'advisor_mengzi',
        name: '孟子',
        level: 4,
        specialAbilities: ['Confucianism', 'Benevolence'],
        biography: 'Mencius, the "Second Sage" of Confucianism. Argued that human nature is inherently good and that rulers must provide for the welfare of the people.',
        portrait: '/portraits/mengzi.png'
    },
    {
        id: 'advisor_xunzi',
        name: '荀子',
        level: 4,
        specialAbilities: ['Confucianism', 'Ritual', 'Legalism Influence'],
        biography: 'A Confucian philosopher who argued that human nature is inherently bad and must be corrected through ritual and education. Teacher of Han Fei and Li Si.',
        portrait: '/portraits/xunzi.png'
    },
    {
        id: 'advisor_zengzi',
        name: '曾子',
        level: 3,
        specialAbilities: ['Confucianism', 'Filial Piety'],
        biography: 'Disciple of Confucius, known for his emphasis on filial piety.',
        portrait: '/portraits/zengzi.png'
    },
    {
        id: 'advisor_zisi',
        name: '子思',
        level: 3,
        specialAbilities: ['Confucianism', 'Doctrine of the Mean'],
        biography: 'Grandson of Confucius and teacher of Mencius. Attributed author of the "Doctrine of the Mean".',
        portrait: '/portraits/zisi.png'
    },
    {
        id: 'advisor_zixia',
        name: '子夏',
        level: 3,
        specialAbilities: ['Confucianism', 'Literature'],
        biography: 'Disciple of Confucius known for his extensive knowledge of literature.',
        portrait: '/portraits/zixia.png'
    },
    {
        id: 'advisor_mozi',
        name: '墨子',
        level: 5,
        specialAbilities: ['Mohism', 'Universal Love', 'Defense'],
        biography: 'Founder of Mohism, advocating for universal love and opposition to offensive warfare. Skilled engineer and fortification expert.',
        portrait: '/portraits/mozi.png'
    },
    {
        id: 'advisor_qinhuali',
        name: '禽滑釐',
        level: 3,
        specialAbilities: ['Mohism', 'Siege Defense'],
        biography: 'A prominent disciple of Mozi, known for his military skills and defensive tactics.',
        portrait: '/portraits/qinhuali.png'
    },
    {
        id: 'advisor_mengsheng',
        name: '孟胜',
        level: 3,
        specialAbilities: ['Mohism', 'Loyalty'],
        biography: 'A Mohist leader known for his unwavering loyalty and martyrdom.',
        portrait: '/portraits/mengsheng.png'
    },
    // Logicians
    {
        id: 'advisor_huishi',
        name: '惠施',
        level: 3,
        specialAbilities: ['Logician', 'Debate'],
        biography: 'A philosopher of the School of Names, famous for his paradoxes and friendship with Zhuangzi.',
        portrait: '/portraits/huishi.png'
    },
    {
        id: 'advisor_gongsunlong',
        name: '公孙龙',
        level: 3,
        specialAbilities: ['Logician', 'Sophistry'],
        biography: 'Famous for the "White Horse is Not a Horse" paradox.',
        portrait: '/portraits/gongsunlong.png'
    },
    // Legalists / Statesmen
    {
        id: 'advisor_guanzhong',
        name: '管仲',
        level: 5,
        specialAbilities: ['Administration', 'Economy', 'Reform'],
        biography: 'Prime Minister of Qi who led the state to hegemony through economic and administrative reforms. "Enrich the country, strengthen the army."',
        portrait: '/portraits/guanzhong.png'
    },
    {
        id: 'advisor_zichan',
        name: '子产',
        level: 4,
        specialAbilities: ['Administration', 'Diplomacy'],
        biography: 'Statesman of Zheng, known for creating the first written code of laws in China.',
        portrait: '/portraits/zichan.png'
    },
    {
        id: 'advisor_hanfei',
        name: '韩非',
        level: 5,
        specialAbilities: ['Legalism', 'Autocracy', 'Law'],
        biography: 'Synthesizer of Legalist philosophy. Emphasized strict laws and the absolute power of the ruler.',
        portrait: '/portraits/hanfei.png'
    },
    {
        id: 'advisor_shangyang',
        name: '商鞅',
        level: 5,
        specialAbilities: ['Legalism', 'Agriculture', 'War'],
        biography: 'Reformer of Qin whose policies laid the foundation for Qin\'s unification of China. Emphasized agriculture and meritocratic military ranks.',
        portrait: '/portraits/shangyang.png'
    },
    {
        id: 'advisor_lishi',
        name: '李斯',
        level: 4,
        specialAbilities: ['Legalism', 'Centralization'],
        biography: 'Chancellor of Qin who implemented standardizations of writing, weights, and measures. Disciple of Xunzi.',
        portrait: '/portraits/lishi.png'
    },
    {
        id: 'advisor_shenbuhai',
        name: '申不害',
        level: 3,
        specialAbilities: ['Legalism', 'Bureaucracy'],
        biography: 'Reformer of Han who focused on "Shu" (administrative technique/statecraft).',
        portrait: '/portraits/shenbuhai.png'
    },
    {
        id: 'advisor_likui',
        name: '李悝',
        level: 4,
        specialAbilities: ['Legalism', 'Agriculture', 'Law Code'],
        biography: 'Reformer of Wei, author of the "Canon of Laws". Promoted agricultural productivity.',
        portrait: '/portraits/likui.png'
    },
    // Strategists / Diplomats
    {
        id: 'advisor_guiguzi',
        name: '鬼谷子',
        level: 5,
        specialAbilities: ['Strategy', 'Diplomacy', 'Mysticism'],
        biography: 'The "Sage of Ghost Valley", a legendary teacher of strategy and diplomacy. Mentor to Su Qin and Zhang Yi.',
        portrait: '/portraits/guiguzi.png'
    },
    {
        id: 'advisor_zhangyi',
        name: '张仪',
        level: 4,
        specialAbilities: ['Diplomacy', 'Horizontal Alliance'],
        biography: 'Strategist who advocated for the "Horizontal Alliance" (Lianheng) to support Qin.',
        portrait: '/portraits/zhangyi.png'
    },
    {
        id: 'advisor_suqin',
        name: '苏秦',
        level: 4,
        specialAbilities: ['Diplomacy', 'Vertical Alliance'],
        biography: 'Strategist who formed the "Vertical Alliance" (Hezong) of six states against Qin.',
        portrait: '/portraits/suqin.png'
    },
    {
        id: 'advisor_sunwu',
        name: '孙武',
        level: 5,
        specialAbilities: ['Military', 'Strategy', 'Art of War'],
        biography: 'Sun Tzu, author of "The Art of War". The most famous military strategist in history.',
        portrait: '/portraits/sunwu.png'
    },
    {
        id: 'advisor_sunbin',
        name: '孙膑',
        level: 4,
        specialAbilities: ['Military', 'Tactics'],
        biography: 'Descendant of Sun Tzu and military strategist for Qi. Famous for the "Battle of Maling".',
        portrait: '/portraits/sunbin.png'
    },
    {
        id: 'advisor_wuqi',
        name: '吴起',
        level: 5,
        specialAbilities: ['Military', 'Training', 'Reform'],
        biography: 'General and reformer who served Lu, Wei, and Chu. Never lost a battle. Author of "Wuzi".',
        portrait: '/portraits/wuqi.png'
    },
    {
        id: 'advisor_weiliao',
        name: '尉缭',
        level: 3,
        specialAbilities: ['Military', 'Strategy'],
        biography: 'Strategist for Qin Shi Huang.',
        portrait: '/portraits/weiliao.png'
    },
    {
        id: 'advisor_fanli',
        name: '范蠡',
        level: 4,
        specialAbilities: ['Economy', 'Strategy', 'Commerce'],
        biography: 'Advisor to King Goujian of Yue, helped destroy Wu. Later became a wealthy merchant known as Tao Zhu Gong.',
        portrait: '/portraits/fanli.png'
    },
    {
        id: 'advisor_wuzixu',
        name: '伍子胥',
        level: 4,
        specialAbilities: ['Military', 'Revenge', 'Planning'],
        biography: 'General of Wu who engineered the capture of the Chu capital to avenge his family.',
        portrait: '/portraits/wuzixu.png'
    },
    // Generals
    {
        id: 'advisor_lianpo',
        name: '廉颇',
        level: 4,
        specialAbilities: ['Military', 'Defense'],
        biography: 'Famous general of Zhao, known for his defensive prowess and the "Thorn Plea" with Lin Xiangru.',
        portrait: '/portraits/lianpo.png'
    },
    {
        id: 'advisor_limu',
        name: '李牧',
        level: 5,
        specialAbilities: ['Military', 'Cavalry', 'Defense'],
        biography: 'General of Zhao who successfully defended against the Xiongnu and Qin. One of the Four Greatest Generals of the Warring States.',
        portrait: '/portraits/limu.png'
    },
    {
        id: 'advisor_baiqi',
        name: '白起',
        level: 5,
        specialAbilities: ['Military', 'Annihilation'],
        biography: 'General of Qin, known as the "Human Butcher". Never defeated, responsible for the deaths of over a million enemy soldiers.',
        portrait: '/portraits/baiqi.png'
    },
    {
        id: 'advisor_wangjian',
        name: '王翦',
        level: 5,
        specialAbilities: ['Military', 'Logistics', 'Conquest'],
        biography: 'General of Qin who conquered Zhao, Yan, and Chu. Known for requesting rewards to prove his lack of political ambition.',
        portrait: '/portraits/wangjian.png'
    },
    // Doctors
    {
        id: 'advisor_bianque',
        name: '扁鹊',
        level: 4,
        specialAbilities: ['Medicine', 'Healing'],
        biography: 'Legendary physician, pioneered the four diagnostic methods of traditional Chinese medicine.',
        portrait: '/portraits/bianque.png'
    },
    // Others / Lords
    {
        id: 'advisor_lvbuwei',
        name: '吕不韦',
        level: 4,
        specialAbilities: ['Economy', 'Politics', 'Patronage'],
        biography: 'Merchant turned Chancellor of Qin. Sponsored the compilation of the "Lüshi Chunqiu".',
        portrait: '/portraits/lvbuwei.png'
    },
    {
        id: 'advisor_quyuan',
        name: '屈原',
        level: 4,
        specialAbilities: ['Literature', 'Patriotism'],
        biography: 'Poet and minister of Chu. His suicide in the Miluo River is commemorated by the Dragon Boat Festival.',
        portrait: '/portraits/quyuan.png'
    },
    {
        id: 'advisor_luban',
        name: '鲁班',
        level: 4,
        specialAbilities: ['Engineering', 'Construction', 'Invention'],
        biography: 'The patron saint of Chinese builders and carpenters. Famous inventor.',
        portrait: '/portraits/luban.png'
    },
    {
        id: 'advisor_linxiangru',
        name: '蔺相如',
        level: 4,
        specialAbilities: ['Diplomacy', 'Courage'],
        biography: 'Minister of Zhao, famous for returning the Jade Disc (Heshibi) intact from Qin.',
        portrait: '/portraits/linxiangru.png'
    },
    // Four Lords of the Warring States
    {
        id: 'advisor_tianwen',
        name: '田文',
        level: 4,
        specialAbilities: ['Patronage', 'Politics'],
        biography: 'Lord Mengchang of Qi, known for hosting thousands of guests and retainers.',
        portrait: '/portraits/tianwen.png'
    },
    {
        id: 'advisor_weiwuji',
        name: '魏无忌',
        level: 4,
        specialAbilities: ['Patronage', 'Military', 'Chivalry'],
        biography: 'Lord Xinling of Wei, stole the tally to save Zhao. Respected for his honor.',
        portrait: '/portraits/weiwuji.png'
    },
    {
        id: 'advisor_zhaosheng',
        name: '赵胜',
        level: 3,
        specialAbilities: ['Patronage', 'Diplomacy'],
        biography: 'Lord Pingyuan of Zhao, known for his diplomacy during the Siege of Handan.',
        portrait: '/portraits/zhaosheng.png'
    },
    {
        id: 'advisor_huangxie',
        name: '黄歇',
        level: 4,
        specialAbilities: ['Patronage', 'Politics'],
        biography: 'Lord Chunshen of Chu, served as Prime Minister for 25 years.',
        portrait: '/portraits/huangxie.png'
    },
    // Yin-Yang / Naturalists
    {
        id: 'advisor_zouyan',
        name: '邹衍',
        level: 3,
        specialAbilities: ['Yin-Yang', 'Five Elements'],
        biography: 'Founder of the School of Yin-Yang and the Five Elements.',
        portrait: '/portraits/zouyan.png'
    },
    // Miscellaneous
    {
        id: 'advisor_shijiao',
        name: '尸佼',
        level: 2,
        specialAbilities: ['Syncretism'],
        biography: 'Syncretist philosopher and advisor to Shang Yang.',
        portrait: '/portraits/shijiao.png'
    },
    {
        id: 'advisor_xuhing',
        name: '许行',
        level: 2,
        specialAbilities: ['Agriculturalism'],
        biography: 'Representative of the Agriculturalists, advocated that rulers should farm alongside their people.',
        portrait: '/portraits/xuhing.png'
    },
    {
        id: 'advisor_chunyu',
        name: '淳于意',
        level: 3,
        specialAbilities: ['Medicine'],
        biography: 'Famous physician of the Western Han (anachronistic but in list), kept detailed medical records.',
        portrait: '/portraits/chunyuyi.png'
    },
    {
        id: 'advisor_liuan',
        name: '刘安',
        level: 3,
        specialAbilities: ['Daoism', 'Alchemy'],
        biography: 'King of Huainan (Han dynasty), sponsored the Huainanzi.',
        portrait: '/portraits/liuan.png'
    },
]

export const generateInitialAdvisors = (settlementIds: string[]): Advisor[] => {
  return ADVISOR_DATA.map((data, index) => {
    // Random location if settlements provided
    const location = settlementIds.length > 0 ? getRandom(settlementIds) : null

    return {
      ...data,
      location,
      ownerId: null, // Initially unhired
    }
  })
}
