import { Idea } from '../types/Idea'
import { School } from '../types/Country'

const createIdea = (
  id: string,
  name: string,
  school: School,
  cost: number,
  prereqs: string[] = [],
  modifierTarget: string = 'stability'
): Idea => ({
  id: `idea_${id}`,
  name,
  description: `${name} idea of ${school}.`,
  school,
  cost,
  prerequisites: prereqs.map(p => `idea_${p}`),
  rewardModifiers: [{
    id: `mod_idea_${id}`,
    name: `${name} Effect`,
    targetAttribute: modifierTarget,
    operator: 'add_percent',
    value: 0.05
  }]
})

export const ideas: Idea[] = [
  // Confucianism
  createIdea('ren', '仁 (Ren - Benevolence)', 'confucianism', 100, [], 'stability'),
  createIdea('yi', '义 (Yi - Righteousness)', 'confucianism', 120, ['ren'], 'stability'),
  createIdea('li', '礼 (Li - Rites)', 'confucianism', 150, ['ren'], 'stability'),
  createIdea('zhi', '智 (Zhi - Wisdom)', 'confucianism', 180, ['li'], 'production_gold'),
  createIdea('xin', '信 (Xin - Integrity)', 'confucianism', 200, ['yi'], 'stability'),
  createIdea('zhong', '忠 (Zhong - Loyalty)', 'confucianism', 250, ['xin'], 'stability'),
  createIdea('xiao', '孝 (Xiao - Filial Piety)', 'confucianism', 300, ['zhong'], 'stability'),
  createIdea('zhongyong', '中庸 (Zhongyong - Doctrine of the Mean)', 'confucianism', 400, ['zhi'], 'stability'),
  createIdea('dezhi', '德治 (Rule of Virtue)', 'confucianism', 500, ['ren'], 'stability'),
  createIdea('wangdao', '王道 (Kingly Way)', 'confucianism', 800, ['dezhi'], 'stability'),

  // Legalism
  createIdea('fa', '法 (Fa - Law)', 'legalism', 100, [], 'authority'),
  createIdea('shu', '术 (Shu - Methodology)', 'legalism', 150, ['fa'], 'authority'),
  createIdea('shi', '势 (Shi - Power)', 'legalism', 200, ['fa'], 'authority'),
  createIdea('fazhi', '法治 (Rule of Law)', 'legalism', 300, ['fa'], 'authority'),
  createIdea('yanxing', '严刑 (Severe Punishment)', 'legalism', 400, ['fazhi'], 'revolt_risk'), // Maybe negative?
  createIdea('junfa', '峻法 (Strict Laws)', 'legalism', 500, ['yanxing'], 'authority'),
  createIdea('lianzuo', '连坐 (Collective Punishment)', 'legalism', 600, ['junfa'], 'revolt_risk'),
  createIdea('gengzhan', '耕战 (Farming and War)', 'legalism', 800, ['fa'], 'production_food'),

  // Mohism
  createIdea('jianai', '兼爱 (Universal Love)', 'mohism', 100, [], 'defense'),
  createIdea('feigong', '非攻 (Non-aggression)', 'mohism', 150, ['jianai'], 'defense'),
  createIdea('jieyong', '节用 (Frugality)', 'mohism', 200, ['jianai'], 'production_gold'),
  createIdea('jiezang', '节葬 (Simplicity in Funerals)', 'mohism', 250, ['jieyong'], 'production_gold'),
  createIdea('shangxian', '尚贤 (Exalting the Virtuous)', 'mohism', 300, ['jianai'], 'production_gold'),
  createIdea('shangtong', '尚同 (Identifying with Superior)', 'mohism', 400, ['shangxian'], 'stability'),
  createIdea('feiming', '非命 (Against Fate)', 'mohism', 500, ['jianai'], 'morale'),
  createIdea('feile', '非乐 (Condemnation of Music)', 'mohism', 600, ['jieyong'], 'production_gold'),

  // Taoism
  createIdea('dao', '道 (Dao)', 'taoism', 100, [], 'happiness'),
  createIdea('wuwei', '无为 (Wu Wei)', 'taoism', 200, ['dao'], 'happiness'),
  createIdea('ziran', '自然 (Nature)', 'taoism', 300, ['wuwei'], 'happiness'),
  createIdea('qiwu', '齐物 (Equality of Things)', 'taoism', 400, ['dao'], 'happiness'),
  createIdea('xiaoyao', '逍遥 (Free and Easy)', 'taoism', 500, ['ziran'], 'happiness'),
  createIdea('yangsheng', '养生 (Life Nourishing)', 'taoism', 600, ['dao'], 'population_growth'),

  // Military
  createIdea('bingshen', '兵贵神速 (Speed)', 'military', 100, [], 'army_speed'),
  createIdea('zhiji', '知己知彼 (Know Enemy)', 'military', 200, [], 'intel'),
  createIdea('qizheng', '奇正相生 (Surprise)', 'military', 300, ['zhiji'], 'army_attack'),
  createIdea('bishi', '避实击虚 (Avoid Strong)', 'military', 400, ['qizheng'], 'army_attack'),

  // Agricultural
  createIdea('nongben', '农本 (Agriculture Base)', 'agricultural', 100, [], 'production_food'),
  createIdea('quannong', '劝农 (Encourage Farming)', 'agricultural', 200, ['nongben'], 'production_food'),
  createIdea('zhongshu', '种树 (Tree Planting)', 'agricultural', 300, ['nongben'], 'production_food'),

  // Diplomacy
  createIdea('hezong', '合纵 (Vertical Alliance)', 'diplomacy', 100, [], 'diplomacy'),
  createIdea('lianheng', '连横 (Horizontal Alliance)', 'diplomacy', 200, [], 'diplomacy'),
  createIdea('yuanjiao', '远交近攻 (Distant Allies)', 'diplomacy', 300, [], 'diplomacy'),

  // Logicians
  createIdea('baima', '白马非马 (White Horse is not Horse)', 'logicians', 100, [], 'research_speed'),
  createIdea('jianbai', '坚白同异 (Hard and White)', 'logicians', 200, ['baima'], 'research_speed'),

  // Misc
  createIdea('jiancai', '兼采 (Eclecticism)', 'misc', 100, [], 'stability'),
  createIdea('lvshi', '吕氏春秋 (Lu\'s Annals)', 'misc', 300, ['jiancai'], 'stability')
]
