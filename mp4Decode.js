const fs = require('fs');

fs.readFile('./12_OKSN-292.txt', function (err, data) {
  if (err) {
    console.log(err);
  } else {
    decodeBox(data);
  }
})

function decodeBox(buffer) {
  let size = buffer2int(buffer.slice(0, 4));
  let type = buffer.slice(4, 8).toString();
  let info = {type,size};
  switch (type) {
    case 'ftyp': {
      info.major_brand = buffer.slice(8, 12).toString();
      info.minor_version = buffer.slice(12, 16);
      info.compatible_brands = buffer.slice(16, size).toString();
      setImmediate(() => {
        decodeBox(buffer.slice(size, buffer.length));
      });
      break;
    }
    case 'moov': {
      // moov box 内部包含了 其他box
      // 处理内部box
      setImmediate(() => {
        decodeBox(buffer.slice(8, size))
      });
      // 处理后面的box
      setImmediate(() => {
        decodeBox(buffer.slice(size, buffer.length));
      });
      break;
    }
    case 'mvhd': {
      // mvhd 是一个full box
      // FullBox，是Box的扩展，Box结构的基础上在Header中增加8bits version和24bits flags。
      info.version = buffer2int(buffer.slice(8, 1));
      info.flags = buffer2int(buffer.slice(9, 12));
      info.createDate = calDateFrom1904(buffer2int(buffer.slice(12, 16)));
      info.modifyDate = calDateFrom1904(buffer2int(buffer.slice(16, 20)));
      // 该数值表示本文件的所有时间描述所采用的单位,0x3E8 = 1000，即将1s平均分为1000份，每份1ms。
      info.timescale = buffer2int(buffer.slice(20, 24));
      // 媒体可播放时长，0xA06A2 =  657058，这个数值的单位与实际时间的对应关系就要通过上面的timescale参数。
      info.duration = buffer2int(buffer.slice(24, 28));
      // duration / timescale = 可播放时长（s）。这里算出该视频能播放657.058s。使用MPC打开，时长与我们计算的一致。
      info.playTime = formatSecond(Math.floor(info.duration / info.timescale));
      info.媒体速率 = buffer2int(buffer.slice(28, 32));
      info.媒体音量 = buffer2int(buffer.slice(32, 34));
      info.remainBuffer = buffer.slice(34, size).toJSON().data.toString();
      // 处理后面的box
      setImmediate(() => {
        decodeBox(buffer.slice(size, buffer.length));
      });
      break;
    }
    case 'trak': {
      // trak full box;
      info.version = buffer2int(buffer.slice(8, 1));
      info.flags = buffer2int(buffer.slice(9, 12));
      // 处理后面的box
      setImmediate(() => {
        decodeBox(buffer.slice(size, buffer.length));
      });
      break;
    }
    case 'tkhd': {
      break;
    }
    default: 
      break;
  }
  console.log(info);
}

function buffer2int(buffer) {
  let size = 0;
  let length = buffer.length;
  for (let i = 0; i < length; i++) {
    size += Math.pow(255, i) * buffer[length - i - 1];
  }
  return size;
}

function calDateFrom1904(timestamp) {
  let ts = new Date('1904/1/1 0:0:0').valueOf() + timestamp * 1000;
  return new Date(ts)
}

function formatSecond(second) {
  // let secondShow = 's';
  // let minuteShow = 'm';
  // let hourShow = 'h'

  // let secondShow = '秒';
  // let minuteShow = '分';
  // let hourShow = '小时'

  let secondShow = '';
  let minuteShow = ':';
  let hourShow = ':'

  if (second < 60) {
    return second + secondShow;
  } else if (second < 60 * 60) {
    let min = Math.floor(second / 60);
    second = second - min * 60;
    return min + minuteShow + second + secondShow;
  } else {
    let hour = Math.floor(second / 60 / 60);
    second = second - hour * 60 * 60;
    let min = Math.floor(second / 60);
    second = second - min * 60;
    return hour + hourShow + min + minuteShow + second + secondShow;
  }
}
/**
 * 

box开头4字节表示该box header 和 box body的大小  

0000 0014 = 20个字节 
如果size = 1 则表示这个box的大小为large size（实际只有mdat类型的box才有可能用到large box）
size = 0 则表示这个box为最后一个box，文件结尾即为box结尾（同样只存在于mdat类型的box）

box 内容
0000 0014 6674 7970 6973 6f6d 0000 0001
6973 6f6d

0000 0014 = 20个字节 size // 4字节 

6674 7970 = ftyp // box type

6973 6f6d = isom // major_brand 4字节

0000 0001 ismo的版本号 // minor_version 4字节

6973 6f6d = isom // compatible_brands 说明本文件遵从ismo一种协议。 4字节


元数据 moov 

 */