const { NativeModules } = require('react-native');

NativeModules.SourceCode.getConstants = () => ({
  scriptURL: 'http://localhost:8081/index.bundle?platform=ios&dev=true',
});
