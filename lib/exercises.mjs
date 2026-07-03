// 30 tiny desk exercises. Rules: about a minute, no equipment, no floor,
// office-clothes friendly, quiet enough for an open office.
export const EXERCISES = [
  {
    id: 'desk-pushups',
    amount: 8,
    unit: 'reps',
    en: {
      name: 'Desk push-ups',
      target: 'Chest and triceps',
      cue: 'Hands on desk, body straight.',
      steps: [
        'Place both hands on a sturdy desk.',
        'Step back until your body forms a straight line.',
        'Lower your chest toward the desk, then press back up.'
      ]
    },
    ja: {
      name: 'デスク腕立て',
      target: '胸・上腕三頭筋',
      cue: '机に手をついて、体をまっすぐ。',
      steps: [
        '安定した机に両手を置く。',
        '体が一直線になるまで足を後ろに引く。',
        '胸を机に近づけてから押し戻す。'
      ]
    }
  },
  {
    id: 'chair-squats',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Chair squats',
      target: 'Legs',
      cue: 'Tap the chair, stand tall.',
      steps: [
        'Stand in front of your chair with feet shoulder-width apart.',
        'Push hips back and lightly tap the chair.',
        'Drive through your feet and stand tall.'
      ]
    },
    ja: {
      name: '椅子スクワット',
      target: '脚',
      cue: '椅子に軽くタッチして、まっすぐ立つ。',
      steps: [
        '椅子の前に足を肩幅で立つ。',
        'お尻を後ろに引いて椅子に軽く触れる。',
        '足裏で床を押して立ち上がる。'
      ]
    }
  },
  {
    id: 'calf-raises',
    amount: 15,
    unit: 'reps',
    en: {
      name: 'Calf raises',
      target: 'Calves',
      cue: 'Rise, pause, lower slow.',
      steps: [
        'Stand tall and hold the desk if needed.',
        'Rise onto the balls of your feet.',
        'Pause briefly, then lower with control.'
      ]
    },
    ja: {
      name: 'カーフレイズ',
      target: 'ふくらはぎ',
      cue: '上がって、止めて、ゆっくり下ろす。',
      steps: [
        '必要なら机に軽く手を添えて立つ。',
        'つま先立ちになる。',
        '一瞬止めてからゆっくり下ろす。'
      ]
    }
  },
  {
    id: 'shoulder-rolls',
    amount: 12,
    unit: 'reps',
    en: {
      name: 'Shoulder rolls',
      target: 'Shoulders',
      cue: 'Big circles, unclench jaw.',
      steps: [
        'Sit or stand tall.',
        'Roll both shoulders up, back, and down.',
        'Keep the motion slow and relaxed.'
      ]
    },
    ja: {
      name: '肩回し',
      target: '肩',
      cue: '大きく回して、あごの力を抜く。',
      steps: [
        '座るか立って背筋を伸ばす。',
        '肩を上げて、後ろに回して、下ろす。',
        'ゆっくりリラックスして動かす。'
      ]
    }
  },
  {
    id: 'standing-twists',
    amount: 12,
    unit: 'reps',
    en: {
      name: 'Standing twists',
      target: 'Core',
      cue: 'Rotate gently side to side.',
      steps: [
        'Stand with soft knees and hands near your ribs.',
        'Rotate your torso gently to one side.',
        'Return to center and rotate to the other side.'
      ]
    },
    ja: {
      name: '立位ツイスト',
      target: '体幹',
      cue: '左右にやさしくひねる。',
      steps: [
        '膝を少しゆるめて立つ。',
        '上半身を片側へやさしく回す。',
        '中央に戻って反対側へ回す。'
      ]
    }
  },
  {
    id: 'wall-sit',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Wall sit',
      target: 'Quads',
      cue: 'Back flat, knees comfortable.',
      steps: [
        'Lean your back against a wall.',
        'Slide down only as far as feels comfortable.',
        'Hold, breathe, then stand back up slowly.'
      ]
    },
    ja: {
      name: 'ウォールシット',
      target: '太もも',
      cue: '背中を壁につけて、無理ない深さで。',
      steps: [
        '背中を壁につける。',
        'きつすぎない位置までゆっくり下がる。',
        '呼吸しながらキープして、ゆっくり立つ。'
      ]
    }
  },
  {
    id: 'plank',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Desk plank',
      target: 'Core',
      cue: 'Forearms on desk, ribs down.',
      steps: [
        'Place forearms on a sturdy desk.',
        'Step back until your body forms a long line.',
        'Brace lightly and hold without shrugging.'
      ]
    },
    ja: {
      name: 'デスクプランク',
      target: '体幹',
      cue: '前腕を机に置いて、肋骨を締める。',
      steps: [
        '安定した机に前腕を置く。',
        '体が長い一直線になるまで足を引く。',
        '肩をすくめず、軽くお腹に力を入れてキープする。'
      ]
    }
  },
  {
    id: 'wrist-resets',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Wrist resets',
      target: 'Wrists',
      cue: 'Slow flex, slow extend.',
      steps: [
        'Hold both arms forward.',
        'Flex wrists down, then extend them up.',
        'Move slowly and stop if anything feels sharp.'
      ]
    },
    ja: {
      name: '手首リセット',
      target: '手首',
      cue: 'ゆっくり曲げて、ゆっくり伸ばす。',
      steps: [
        '両腕を前に出す。',
        '手首を下に曲げてから上に伸ばす。',
        'ゆっくり動かし、鋭い痛みがあれば止める。'
      ]
    }
  },
  {
    id: 'glute-squeezes',
    amount: 12,
    unit: 'reps',
    en: {
      name: 'Glute squeezes',
      target: 'Glutes',
      cue: 'Squeeze, hold, release.',
      steps: [
        'Sit or stand with a tall posture.',
        'Squeeze your glutes for one second.',
        'Release fully before the next rep.'
      ]
    },
    ja: {
      name: 'お尻スクイーズ',
      target: 'お尻',
      cue: '締めて、止めて、ゆるめる。',
      steps: [
        '座るか立って姿勢を整える。',
        'お尻に1秒ほど力を入れる。',
        '完全にゆるめてから次のrepへ。'
      ]
    }
  },
  {
    id: 'marches',
    amount: 20,
    unit: 'reps',
    en: {
      name: 'Standing marches',
      target: 'Hips',
      cue: 'Lift knees, stay relaxed.',
      steps: [
        'Stand tall beside your desk.',
        'Lift one knee, then lower it.',
        'Alternate sides at an easy pace.'
      ]
    },
    ja: {
      name: 'その場マーチ',
      target: '股関節',
      cue: '膝を上げて、力まずに。',
      steps: [
        '机の横でまっすぐ立つ。',
        '片膝を上げて下ろす。',
        '左右交互に楽なペースで続ける。'
      ]
    }
  },
  {
    id: 'neck-rolls',
    amount: 8,
    unit: 'reps',
    en: {
      name: 'Neck rolls',
      target: 'Neck',
      cue: 'Slow half-circles, never force it.',
      steps: [
        'Drop your chin toward your chest.',
        'Roll one ear toward a shoulder, then the other.',
        'Keep it slow and skip anything that pinches.'
      ]
    },
    ja: {
      name: 'ネックロール',
      target: '首',
      cue: 'ゆっくり半円、無理はしない。',
      steps: [
        'あごを胸にそっと近づける。',
        '耳を片方の肩へ、次に反対側へ転がす。',
        '痛む角度は飛ばして、ゆっくり動かす。'
      ]
    }
  },
  {
    id: 'chin-tucks',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Chin tucks',
      target: 'Neck',
      cue: 'Make a double chin, hold, release.',
      steps: [
        'Sit tall and look straight ahead.',
        'Draw your chin straight back.',
        'Hold for a beat, then release.'
      ]
    },
    ja: {
      name: 'あご引き',
      target: '首',
      cue: '二重あごを作って、止めて、戻す。',
      steps: [
        '背筋を伸ばして正面を見る。',
        'あごを真後ろに引く。',
        '一拍キープしてから戻す。'
      ]
    }
  },
  {
    id: 'shoulder-shrugs',
    amount: 12,
    unit: 'reps',
    en: {
      name: 'Shoulder shrugs',
      target: 'Shoulders',
      cue: 'Lift to your ears, drop and melt.',
      steps: [
        'Sit or stand with arms relaxed.',
        'Lift both shoulders toward your ears.',
        'Drop them completely and feel the release.'
      ]
    },
    ja: {
      name: '肩すくめ',
      target: '肩',
      cue: '耳まで上げて、ストンと落とす。',
      steps: [
        '腕の力を抜いて座るか立つ。',
        '両肩を耳に近づけるように上げる。',
        '一気に脱力して落とす。'
      ]
    }
  },
  {
    id: 'arm-circles',
    amount: 15,
    unit: 'reps',
    en: {
      name: 'Arm circles',
      target: 'Shoulders',
      cue: 'Small circles first, then bigger.',
      steps: [
        'Extend both arms out to the sides.',
        'Draw small circles, growing gradually larger.',
        'Reverse direction halfway through.'
      ]
    },
    ja: {
      name: 'アームサークル',
      target: '肩',
      cue: '小さい円から、だんだん大きく。',
      steps: [
        '両腕を横に伸ばす。',
        '小さな円からだんだん大きく回す。',
        '半分で逆回転に切り替える。'
      ]
    }
  },
  {
    id: 'overhead-reach',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Overhead reach',
      target: 'Back',
      cue: 'Reach tall, breathe, grow an inch.',
      steps: [
        'Interlace your fingers and reach overhead.',
        'Press palms toward the ceiling.',
        'Breathe slowly and stretch a little taller.'
      ]
    },
    ja: {
      name: 'バンザイ伸び',
      target: '背中',
      cue: '天井へ伸びて、深呼吸。',
      steps: [
        '指を組んで頭の上へ伸ばす。',
        '手のひらを天井へ押し上げる。',
        'ゆっくり呼吸しながらもう少しだけ高く伸びる。'
      ]
    }
  },
  {
    id: 'side-bends',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Standing side bends',
      target: 'Obliques',
      cue: 'Slide down one side, then the other.',
      steps: [
        'Stand tall with feet hip-width apart.',
        'Slide one hand down your thigh as you bend sideways.',
        'Return to center and switch sides.'
      ]
    },
    ja: {
      name: '体側伸ばし',
      target: 'わき腹',
      cue: '片側ずつ、ゆっくり倒す。',
      steps: [
        '足を腰幅に開いて立つ。',
        '手を太ももに沿わせながら真横に倒す。',
        '中央に戻って反対側へ。'
      ]
    }
  },
  {
    id: 'seated-twist',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Seated twist',
      target: 'Spine',
      cue: 'Rotate, hold, breathe into it.',
      steps: [
        'Sit sideways-ready with feet flat.',
        'Rotate your torso and hold the chair back.',
        'Hold and breathe, then switch sides halfway.'
      ]
    },
    ja: {
      name: '椅子ツイスト',
      target: '背骨',
      cue: 'ひねって、止めて、呼吸する。',
      steps: [
        '足裏を床につけて座る。',
        '上半身をひねって背もたれを軽くつかむ。',
        '呼吸しながらキープし、半分で反対側へ。'
      ]
    }
  },
  {
    id: 'chest-opener',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Chest opener',
      target: 'Chest',
      cue: 'Hands behind back, open proud.',
      steps: [
        'Clasp your hands behind your back.',
        'Straighten arms and lift your chest.',
        'Squeeze shoulder blades gently and breathe.'
      ]
    },
    ja: {
      name: '胸ひらき',
      target: '胸',
      cue: '後ろで手を組んで、胸を張る。',
      steps: [
        '背中の後ろで手を組む。',
        '腕を伸ばして胸を持ち上げる。',
        '肩甲骨を軽く寄せて呼吸する。'
      ]
    }
  },
  {
    id: 'desk-dips',
    amount: 8,
    unit: 'reps',
    en: {
      name: 'Desk dips',
      target: 'Triceps',
      cue: 'Shallow dips, sturdy desk only.',
      steps: [
        'Face away from a sturdy desk, hands on its edge.',
        'Walk your feet forward slightly.',
        'Bend elbows a little, then press back up.'
      ]
    },
    ja: {
      name: 'デスクディップス',
      target: '上腕三頭筋',
      cue: '浅めでOK、頑丈な机限定。',
      steps: [
        '机に背を向けて、縁に両手を置く。',
        '足を少し前に歩かせる。',
        '肘を浅く曲げてから押し上げる。'
      ]
    }
  },
  {
    id: 'lunges',
    amount: 8,
    unit: 'reps',
    en: {
      name: 'Standing lunges',
      target: 'Legs',
      cue: 'Short steps, tall chest.',
      steps: [
        'Step one foot forward a short distance.',
        'Lower straight down as far as comfortable.',
        'Push back to standing and alternate legs.'
      ]
    },
    ja: {
      name: 'その場ランジ',
      target: '脚',
      cue: '歩幅は短く、胸は高く。',
      steps: [
        '片足を少し前に踏み出す。',
        '無理のない深さまで真下に沈む。',
        '押し戻して立ち、左右交互に。'
      ]
    }
  },
  {
    id: 'hip-hinges',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Hip hinges',
      target: 'Hamstrings',
      cue: 'Push hips back, keep back flat.',
      steps: [
        'Stand with soft knees, hands on hips.',
        'Push your hips back and lean your chest forward.',
        'Squeeze your glutes to stand back up.'
      ]
    },
    ja: {
      name: 'ヒップヒンジ',
      target: 'もも裏',
      cue: 'お尻を後ろへ、背中はまっすぐ。',
      steps: [
        '膝をゆるめて立ち、手を腰に当てる。',
        'お尻を後ろに引きながら上体を前に倒す。',
        'お尻に力を入れて立ち上がる。'
      ]
    }
  },
  {
    id: 'side-leg-raises',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Side leg raises',
      target: 'Hips',
      cue: 'Hold the desk, lift out, control down.',
      steps: [
        'Stand tall holding the desk for balance.',
        'Lift one leg straight out to the side.',
        'Lower with control and switch sides halfway.'
      ]
    },
    ja: {
      name: 'サイドレッグレイズ',
      target: '股関節',
      cue: '机を支えに、横へ上げてゆっくり戻す。',
      steps: [
        '机に手を添えてまっすぐ立つ。',
        '片脚を真横に持ち上げる。',
        'ゆっくり戻し、半分で反対側へ。'
      ]
    }
  },
  {
    id: 'seated-leg-extensions',
    amount: 12,
    unit: 'reps',
    en: {
      name: 'Seated leg extensions',
      target: 'Quads',
      cue: 'Straighten, squeeze, lower slow.',
      steps: [
        'Sit tall with feet flat on the floor.',
        'Straighten one leg until it is level.',
        'Squeeze the thigh, lower slowly, alternate legs.'
      ]
    },
    ja: {
      name: '座位レッグエクステンション',
      target: '太もも',
      cue: '伸ばして、締めて、ゆっくり下ろす。',
      steps: [
        '足裏を床につけて背筋を伸ばして座る。',
        '片脚を水平まで伸ばす。',
        '太ももを締めてからゆっくり下ろし、左右交互に。'
      ]
    }
  },
  {
    id: 'seated-knee-tucks',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Seated knee tucks',
      target: 'Core',
      cue: 'Knees up, ribs down, no slouching.',
      steps: [
        'Sit on the front edge of a stable chair.',
        'Hold the seat and lift both knees slightly.',
        'Lower with control and repeat.'
      ]
    },
    ja: {
      name: '座位ニータック',
      target: '体幹',
      cue: '膝を上げて、猫背にならない。',
      steps: [
        '安定した椅子の前側に浅く座る。',
        '座面をつかんで両膝を少し持ち上げる。',
        'ゆっくり下ろして繰り返す。'
      ]
    }
  },
  {
    id: 'ankle-circles',
    amount: 10,
    unit: 'reps',
    en: {
      name: 'Ankle circles',
      target: 'Ankles',
      cue: 'Each direction, each foot.',
      steps: [
        'Lift one foot slightly off the floor.',
        'Circle the ankle both directions.',
        'Switch feet halfway through.'
      ]
    },
    ja: {
      name: '足首回し',
      target: '足首',
      cue: '両回し、両足で。',
      steps: [
        '片足を床から少し浮かせる。',
        '足首を両方向に回す。',
        '半分で反対の足に替える。'
      ]
    }
  },
  {
    id: 'hamstring-stretch',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Hamstring stretch',
      target: 'Hamstrings',
      cue: 'Heel out, hinge, gentle pull only.',
      steps: [
        'Place one heel forward with the leg straight.',
        'Push your hips back and lean slightly forward.',
        'Hold the gentle stretch, switching legs halfway.'
      ]
    },
    ja: {
      name: 'もも裏ストレッチ',
      target: 'もも裏',
      cue: 'かかとを前に、気持ちいい範囲で。',
      steps: [
        '片脚のかかとを前に出して伸ばす。',
        'お尻を引きながら少し前に倒れる。',
        '軽い伸びを感じてキープ、半分で反対脚へ。'
      ]
    }
  },
  {
    id: 'quad-stretch',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Standing quad stretch',
      target: 'Quads',
      cue: 'Hold the desk, heel to hip, knees together.',
      steps: [
        'Hold the desk with one hand for balance.',
        'Pull the opposite heel toward your hip.',
        'Keep knees together, switch legs halfway.'
      ]
    },
    ja: {
      name: 'もも前ストレッチ',
      target: 'もも前',
      cue: '机を支えに、かかとをお尻へ。',
      steps: [
        '片手で机を支える。',
        '反対のかかとをお尻に引き寄せる。',
        '膝をそろえてキープ、半分で反対脚へ。'
      ]
    }
  },
  {
    id: 'forearm-stretch',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Forearm stretch',
      target: 'Forearms',
      cue: 'Palm up, gentle pull, swap hands.',
      steps: [
        'Extend one arm with the palm facing up.',
        'Gently pull the fingers down with the other hand.',
        'Hold, then swap hands halfway.'
      ]
    },
    ja: {
      name: '前腕ストレッチ',
      target: '前腕',
      cue: '手のひらを上に、やさしく引く。',
      steps: [
        '手のひらを上にして片腕を伸ばす。',
        'もう片方の手で指をやさしく手前に引く。',
        'キープして、半分で反対の手へ。'
      ]
    }
  },
  {
    id: 'distance-gaze',
    amount: 20,
    unit: 'seconds',
    en: {
      name: 'Distance gaze',
      target: 'Eyes',
      cue: 'Find the farthest thing, stare, blink.',
      steps: [
        'Look away from every screen.',
        'Fix your eyes on the farthest thing you can see.',
        'Blink slowly and let your focus soften.'
      ]
    },
    ja: {
      name: '遠くを見る',
      target: '目',
      cue: '一番遠くを見て、まばたき。',
      steps: [
        'すべての画面から目を離す。',
        '見える中で一番遠いものに視線を固定する。',
        'ゆっくりまばたきしてピントをゆるめる。'
      ]
    }
  },
  {
    id: 'box-breathing',
    amount: 4,
    unit: 'reps',
    en: {
      name: 'Box breathing',
      target: 'Nerves',
      cue: 'In 4, hold 4, out 4, hold 4.',
      steps: [
        'Inhale through your nose for 4 counts.',
        'Hold for 4, exhale for 4, hold for 4.',
        'That is one rep. Shoulders stay heavy.'
      ]
    },
    ja: {
      name: 'ボックス呼吸',
      target: '自律神経',
      cue: '4秒吸って、4秒止めて、4秒吐く。',
      steps: [
        '鼻から4秒かけて吸う。',
        '4秒止めて、4秒で吐いて、4秒止める。',
        'これで1回。肩の力は抜いたまま。'
      ]
    }
  }
];
