import { Technology } from '../types/Technology'

const createTech = (
  id: string, 
  name: string, 
  category: 'production' | 'military' | 'secret', 
  costVal: number, 
  prereqs: string[] = [],
  modifierTarget: string = 'production_gold'
): Technology => ({
  id: `tech_${id}`,
  name,
  description: `${name} technology.`,
  category,
  cost: category === 'production' ? { engineering_practice: costVal } : 
        category === 'military' ? { military_practice: costVal } : 
        { gold: costVal * 10 }, // Secret techs cost gold for now? Or just locked.
  prerequisites: prereqs.map(p => `tech_${p}`),
  rewardModifiers: [{
    id: `mod_${id}`,
    name: `${name} Bonus`,
    targetAttribute: modifierTarget,
    operator: 'add_percent',
    value: 0.01
  }]
})

export const productionTechs: Technology[] = [
  createTech('jingtian', '井田制 (Well-field System)', 'production', 10, [], 'production_food'),
  createTech('tieli', '铁犁 (Iron Plow)', 'production', 20, ['jingtian'], 'production_food'),
  createTech('lunzuo', '轮作 (Crop Rotation)', 'production', 30, ['tieli'], 'production_food'),
  createTech('shuili', '水利 (Irrigation)', 'production', 40, ['lunzuo'], 'production_food'),
  createTech('dujiangyan', '都江堰 (Dujiangyan)', 'production', 100, ['shuili'], 'production_food'),
  createTech('zhengguoqu', '郑国渠 (Zheng Guo Canal)', 'production', 120, ['shuili'], 'production_food'),
  createTech('kanerjing', '坎儿井 (Karen Well)', 'production', 80, ['shuili'], 'production_food'),
  createTech('tongche', '筒车 (Water Wheel)', 'production', 50, ['shuili'], 'production_food'),
  createTech('fanche', '翻车 (Chain Pump)', 'production', 60, ['tongche'], 'production_food'),
  createTech('longgushuiche', '龙骨水车 (Keel Water Wheel)', 'production', 70, ['fanche'], 'production_food'),
  createTech('yetie', '冶铁 (Iron Smelting)', 'production', 50, ['tieli'], 'production_metal'),
  createTech('guangangfa', '灌钢法 (Co-fusion Steel)', 'production', 150, ['yetie'], 'production_metal'),
  createTech('chaogang', '炒钢 (Puddling)', 'production', 120, ['yetie'], 'production_metal'),
  createTech('cuihuo', '淬火 (Quenching)', 'production', 80, ['yetie'], 'production_metal'),
  createTech('gufengji', '鼓风机 (Bellows)', 'production', 60, ['yetie'], 'production_metal'),
  createTech('shuipai', '水排 (Water-powered Bellows)', 'production', 100, ['gufengji'], 'production_metal'),
  createTech('shichou', '丝绸 (Silk)', 'production', 30, [], 'production_gold'),
  createTech('fangche', '纺车 (Spinning Wheel)', 'production', 40, ['shichou'], 'production_gold'),
  createTech('tihuaji', '提花机 (Jacquard Loom)', 'production', 80, ['fangche'], 'production_gold'),
  createTech('ciqi', '瓷器 (Porcelain)', 'production', 50, [], 'production_gold'),
  createTech('qingci', '青瓷 (Celadon)', 'production', 70, ['ciqi'], 'production_gold'),
  createTech('baici', '白瓷 (White Porcelain)', 'production', 90, ['qingci'], 'production_gold'),
  createTech('zaozhi', '造纸术 (Papermaking)', 'production', 200, [], 'production_gold'),
  createTech('yinshua', '印刷术 (Printing)', 'production', 300, ['zaozhi'], 'production_gold')
]

export const militaryTechs: Technology[] = [
  createTech('bubing', '步兵 (Infantry)', 'military', 10, [], 'army_defense'),
  createTech('fangzhen', '方阵 (Phalanx)', 'military', 20, ['bubing'], 'army_defense'),
  createTech('weiwuzu', '魏武卒 (Wei Wu Soldiers)', 'military', 50, ['fangzhen'], 'army_attack'),
  createTech('qinruishi', '秦锐士 (Qin Sharp Soldiers)', 'military', 60, ['fangzhen'], 'army_attack'),
  createTech('gongjian', '弓箭 (Archery)', 'military', 15, [], 'army_attack'),
  createTech('fugong', '复合弓 (Composite Bow)', 'military', 30, ['gongjian'], 'army_attack'),
  createTech('nu', '弩 (Crossbow)', 'military', 40, ['fugong'], 'army_attack'),
  createTech('liannu', '连弩 (Repeating Crossbow)', 'military', 80, ['nu'], 'army_attack'),
  createTech('qibing', '骑兵 (Cavalry)', 'military', 20, [], 'army_speed'),
  createTech('hufuqishe', '胡服骑射 (Hu Clothing & Archery)', 'military', 50, ['qibing', 'gongjian'], 'army_speed'),
  createTech('juzhuang', '具装骑兵 (Cataphract)', 'military', 100, ['qibing', 'yetie'], 'army_defense'),
  createTech('zhanche', '战车 (Chariot)', 'military', 30, [], 'army_attack'),
  createTech('sima', '四马战车 (Four-horse Chariot)', 'military', 60, ['zhanche'], 'army_attack'),
  createTech('bingfa', '兵法 (Art of War)', 'military', 50, [], 'army_morale'),
  createTech('sunzi', '孙子兵法 (Sun Tzu)', 'military', 100, ['bingfa'], 'army_morale'),
  createTech('sunbin', '孙膑兵法 (Sun Bin)', 'military', 100, ['bingfa'], 'army_morale'),
  createTech('wuzi', '吴子 (Wu Zi)', 'military', 80, ['bingfa'], 'army_morale'),
  createTech('louchuan', '楼船 (Tower Ship)', 'military', 40, [], 'navy_attack'),
  createTech('mengchong', '艨艟 (Mengchong)', 'military', 50, ['louchuan'], 'navy_speed'),
  createTech('doujian', '斗舰 (Warship)', 'military', 60, ['louchuan'], 'navy_attack'),
  createTech('paigan', '拍杆 (Pai Gan)', 'military', 70, ['doujian'], 'navy_attack'),
  createTech('fenghuotai', '烽火台 (Beacon Tower)', 'military', 30, [], 'intel'),
  createTech('changcheng', '长城 (Great Wall)', 'military', 200, ['fenghuotai'], 'defense'),
  createTech('wubao', '坞堡 (Fortified Manor)', 'military', 40, [], 'defense'),
  createTech('juntun', '军屯 (Military Colony)', 'military', 60, ['bubing'], 'production_food')
]

export const secretTechs: Technology[] = [
  createTech('huoyao', '火药 (Gunpowder)', 'secret', 500, [], 'army_attack'),
  createTech('tuhuoqiang', '突火枪 (Fire Lance)', 'secret', 600, ['huoyao'], 'army_attack'),
  createTech('zhentianlei', '震天雷 (Thunder Crash Bomb)', 'secret', 700, ['huoyao'], 'army_attack'),
  createTech('huopao', '火炮 (Cannon)', 'secret', 1000, ['zhentianlei'], 'army_attack'),
  createTech('niaochong', '鸟铳 (Musket)', 'secret', 1200, ['tuhuoqiang'], 'army_attack'),
  createTech('xilahuo', '希腊火 (Greek Fire)', 'secret', 800, [], 'navy_attack'),
  createTech('luoma', '罗马方阵 (Roman Legion)', 'secret', 400, [], 'army_defense'),
  createTech('damashige', '大马士革钢 (Damascus Steel)', 'secret', 500, [], 'production_metal'),
  createTech('liandan', '道家炼丹 (Taoist Alchemy)', 'secret', 300, [], 'production_gold'),
  createTech('suodi', '缩地成寸 (Teleportation)', 'secret', 9999, [], 'army_speed'),
  createTech('sadou', '撒豆成兵 (Bean Soldiers)', 'secret', 8888, [], 'manpower'),
  createTech('jiguanshou', '机关兽 (Clockwork Beast)', 'secret', 2000, [], 'army_attack'),
  createTech('muniu', '木牛流马 (Wooden Ox)', 'secret', 1500, [], 'logistics'),
  createTech('zhengqiji', '蒸汽机 (Steam Engine)', 'secret', 5000, [], 'production_industry'),
  createTech('dianli', '电力 (Electricity)', 'secret', 10000, ['zhengqiji'], 'production_industry')
]

export const allTechs = [...productionTechs, ...militaryTechs, ...secretTechs]
