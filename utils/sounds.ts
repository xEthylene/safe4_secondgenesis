//
// 位于: utils/sounds.ts
//
export type SoundKey =
    'play_card' |
    'play_card_enemy' |
    'player_hit' |
    'player_block' |
    'enemy_hit' |
    'enemy_block' |
    'draw_card' |
    'shuffle_deck' |
    'status_damage' |
    'end_turn' |
    'ui_click' |
    'ui_button_press';

// 1. 创建一个映射，将我们的音效键名关联到真实的音频文件路径
// *** 您可以在这里修改或添加自己的音频文件路径 ***
const soundMap: Record<SoundKey, string> = {
    'play_card': '/sounds/playcard.ogg',
    'play_card_enemy': '/sounds/playcard.ogg',
    'player_hit': '/sounds/player_hit.ogg',
    'player_block': '/sounds/player_block.ogg',
    'enemy_hit': '/sounds/enemy_hit.ogg',
    'enemy_block': '/sounds/enemy_block.ogg',
    'draw_card': '/sounds/draw_card.mp3',
    'shuffle_deck': '/sounds/shuffle_deck.ogg',
    'status_damage': '/sounds/status_damage.ogg',
    'end_turn': '/sounds/end_turn.mp3',
    'ui_click': '/sounds/ui_click.ogg',
    'ui_button_press': '/sounds/ui_button_press.ogg',
};

// 2. 存储当前正在播放的音频实例，以支持快速连续播放
const audioInstances: Record<string, HTMLAudioElement[]> = {};
const MAX_INSTANCES_PER_SOUND = 5; // 允许同一种音效最多同时播放5次

export const playSound = (key: SoundKey) => {
    // 3. 从映射中查找文件路径
    const soundFile = soundMap[key];
    if (!soundFile) {
        console.warn(`[SOUND] Sound key not found in map: ${key}`);
        return;
    }

    // 4. 使用 Web Audio API 创建并播放声音
    try {
        if (!audioInstances[key]) {
            audioInstances[key] = [];
        }

        // 寻找一个已经播放完毕的实例来复用
        let audio = audioInstances[key].find(instance => instance.paused);

        if (audio) {
            // 如果找到了，重置它的播放时间并再次播放
            audio.currentTime = 0;
        } else if (audioInstances[key].length < MAX_INSTANCES_PER_SOUND) {
            // 如果没找到，并且还没达到实例上限，就创建一个新的
            audio = new Audio(soundFile);
            audioInstances[key].push(audio);
        } else {
            // 如果达到了实例上限，就取最旧的一个来复用
            audio = audioInstances[key][0];
            audioInstances[key].shift(); // 把它从数组头部移除
            audioInstances[key].push(audio); // 再把它加到尾部
            audio.currentTime = 0;
        }

        audio.play().catch(error => {
            // 浏览器可能会因为用户没有交互而阻止自动播放，这里静默处理
        });
    } catch (e) {
        console.error(`[SOUND] Error playing sound ${key}:`, e);
    }
};