import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export class PermissionManager {
  static async requestStoragePermission(): Promise<boolean> {
    console.log('=== 开始请求存储权限 ===');
    console.log('当前平台:', Platform.OS);
    
    if (Platform.OS !== 'android') {
      console.log('非Android平台，跳过权限请求');
      return true;
    }

    try {
      // 先检查是否已经有权限
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      console.log('当前权限状态:', hasPermission ? '已授权' : '未授权');

      if (hasPermission) {
        console.log('已有存储权限，无需请求');
        return true;
      }

      console.log('开始请求存储权限...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: '存储权限',
          message: '应用需要存储权限来保存数据库文件，请在接下来的弹窗中点击"允许"',
          buttonNeutral: '稍后询问',
          buttonNegative: '取消',
          buttonPositive: '确定',
        }
      );

      console.log('权限请求结果:', granted);
      console.log('权限状态:', {
        GRANTED: PermissionsAndroid.RESULTS.GRANTED,
        DENIED: PermissionsAndroid.RESULTS.DENIED,
        NEVER_ASK_AGAIN: PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('用户授予了存储权限');
        return true;
      } else {
        console.log('用户拒绝了存储权限');
        // 显示提示对话框，引导用户去设置中开启权限
        Alert.alert(
          '需要存储权限',
          '应用需要存储权限才能正常工作。请在设置中授予权限。',
          [
            {
              text: '取消',
              style: 'cancel',
              onPress: () => console.log('用户点击了取消')
            },
            {
              text: '去设置',
              onPress: () => {
                console.log('用户点击了去设置');
                // 打开应用设置页面
                Linking.openSettings();
              }
            }
          ]
        );
        return false;
      }
    } catch (err) {
      console.error('请求存储权限时发生错误:', err);
      Alert.alert(
        '权限请求失败',
        '请求存储权限时发生错误，请重试。',
        [
          {
            text: '取消',
            style: 'cancel',
            onPress: () => console.log('用户点击了取消')
          },
          {
            text: '去设置',
            onPress: () => {
              console.log('用户点击了去设置');
              // 打开应用设置页面
              Linking.openSettings();
            }
          }
        ]
      );
      return false;
    }
  }
} 