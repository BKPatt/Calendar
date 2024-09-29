import { AppRegistry } from 'react-native';
import App from './src/App';

AppRegistry.registerComponent('CalendarApp', () => App);

if (window.document) {
    AppRegistry.runApplication('CalendarApp', {
        initialProps: {},
        rootTag: document.getElementById('root'),
    });
}