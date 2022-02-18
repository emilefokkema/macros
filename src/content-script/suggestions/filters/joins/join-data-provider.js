import { StylePropertyValueExtractor } from '../value-extractors/style-property-value-extractor';
import { RectangleValueExtractor } from '../value-extractors/rectangle-value-extractor';

export class JoinDataProvider{
    styleProperty(propertyName){
        return new StylePropertyValueExtractor(propertyName);
    }
    rect(){
        return new RectangleValueExtractor();
    }
}