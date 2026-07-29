import { Component, ElementRef, Input, AfterViewInit, inject, effect, signal } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { GPSLocalizacionDTO } from '../../domain/gps.domain';
import { GPSService } from '../../services/gps.service';

export const DEFAULT_HEIGHT = '500px';
export const DEFAULT_WIDTH = '500px';
export const DEFAULT_LAT = 4.6187533;
export const DEFAULT_LON = -74.1592163;
export const DEFAULT_ANCHOR = [1, 1];
export const DEFAULT_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAyVBMVEUAAADnTDznTDvnTDvnTDvAOCrnTDznSzvnTDvAOCvnTDznTDznTDvnTDzAOCrnTDvnTDvnTDvnTDznTDvAOSrnTDznTDzTQjLSQjPnTDzpTDvnSzvAOCrnTDvAOSvAOCvnSzvnTDzAOCvnSzznTDznTDvnTDy/OCvnTDznTDvnTDznSzvmSzvAOCvnTDzAOCvnTDvmTDvAOCq+OCrpTDzkSzrbRjbWRDTMPi+8NinrTT3EOy3gSDjTQjPPQDLHPS/DOiu5NCjHPC5jSfbDAAAAMHRSTlMAKPgE4hr8CfPy4NzUt7SxlnpaVlRPIhYPLgLt6ebOysXAwLmej4iGgGtpYkpAPCBw95QiAAAB50lEQVQ4y42T13aDMAxAbVb2TrO6927lwQhktf//UZWVQ1sIJLnwwBEXWZYwy1Lh/buG5TXu+rzC9nByDQCCbrg+KdUmLUsgW08IqzUp9rgDf5Ds8CJv1KS3mNL3fbGlOdr1Kh1AtFgs15vke7kQGpDO7pYGtJgfbRSxiXxaf7AjgsFfy1/WPu0r73WpwGiu1Fn78bF9JpWKUBTQzYlNQIK5lDcuQ9wbKeeBiTWz3vgUv44TpS4njJhcKpXEuMzpOCN+VE2FmPA9jbxjSrOf6kdG7FvYmkBJ6aYRV0oVYIusfkZ8xeHpUMna+LeYmlShxkG+Zv8GyohLf6aRzzRj9t+YVgWaX1IO08hQyi9tapxmB3huxJUp8q/EVYzB89wQr0y/FwqrHLqoDWsoLsxQr1iWNxp1iCnlRbt9IdELwfDGcrSMKJbGxLx4LenTFsszFSYehwl6aCZhTNPnO6LdBYOGYBVFqwAfDF27+CQIvLUGrTU9lpyFBw9yeA+sCNsRkJ5WQjg2K+QFcrywEjoCBHVpe3VYGZyk9NQCLxXte/jHvc1K4XXKSNQ520PPtIhcr8f2MXPShNiavTyn4jM7wK0g75YdYgTE6KA465nN9GbsILwhoMHZETx53hM7Brtet9lRDAYFwR80rG+sfAnbpQAAAABJRU5ErkJggg==';

@Component({
  selector: 'app-map',
  imports: [],
  template: `
    @if (!locations().length) {
      <div class="p-8 sm:p-16 border-t text-4xl font-semibold tracking-tight text-center">There are no locations!</div>
    }
    <div [id]="target"></div>
  `,
})
export class MapComponent implements AfterViewInit {
  @Input() zoom = 15;
  @Input() width: string | number = DEFAULT_WIDTH;
  @Input() height: string | number = DEFAULT_HEIGHT;
  @Input() anchor: number[] = DEFAULT_ANCHOR;
  @Input() icon: string = DEFAULT_ICON;

  private readonly elementRef = inject(ElementRef);
  private readonly gpsService = inject(GPSService);

  readonly target = 'map-' + Math.random().toString(36).substring(2);
  readonly locations = this.gpsService.locations;

  private map!: Map;
  private vectorLayer?: VectorLayer<VectorSource>;
  private pointsVectorLayer?: VectorLayer<VectorSource>;

  private readonly viewMap = new View({
    center: fromLonLat([DEFAULT_LON, DEFAULT_LAT]),
    zoom: 15,
  });

  constructor() {
    effect(() => {
      const locations = this.gpsService.locations();
      if (locations && this.map) this.addPoint(locations);
    });
  }

  ngAfterViewInit() {
    this.setSize();
    this.map = new Map({
      layers: [new TileLayer({ source: new OSM() })],
      target: this.target,
      view: this.viewMap,
    });
  }

  private setSize() {
    const el = this.elementRef.nativeElement.querySelector('#' + this.target) as HTMLElement;
    if (el) {
      el.style.height = coerceCssPixelValue(this.height) || DEFAULT_HEIGHT;
      el.style.width = coerceCssPixelValue(this.width) || DEFAULT_WIDTH;
    }
  }

  private addPoint(locations: GPSLocalizacionDTO[]) {
    if (this.pointsVectorLayer) this.map.removeLayer(this.pointsVectorLayer);
    if (!this.map) return;

    const markers: Feature<Point>[] = [];
    let lastPoint: GPSLocalizacionDTO | undefined;

    if (!locations || !locations.length) return;
    for (const element of locations) {
      if (element.latitud !== 0 && element.longitud !== 0) {
        markers.push(new Feature({ geometry: new Point(fromLonLat([element.longitud, element.latitud])) }));
        lastPoint = element;
      }
    }

    const vectorSource = new VectorSource({ features: markers });
    this.pointsVectorLayer = new VectorLayer({ source: vectorSource });
    this.pointsVectorLayer.setZIndex(9);
    this.map.addLayer(this.pointsVectorLayer);

    if (lastPoint) this.addMarker(lastPoint.latitud, lastPoint.longitud);
  }

  private center(lat: number, lng: number) {
    this.map.getView().animate({ zoom: this.zoom, center: fromLonLat([lng, lat]) });
  }

  private addMarker(lat: number, lng: number) {
    if (this.vectorLayer) this.map.removeLayer(this.vectorLayer);
    const marker = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
    const iconStyle = new Style({ image: new Icon({ anchor: this.anchor as [number, number], src: this.icon }) });
    marker.setStyle(iconStyle);

    const vectorSource = new VectorSource({ features: [marker] });
    this.vectorLayer = new VectorLayer({ source: vectorSource });
    this.vectorLayer.setZIndex(10);
    this.map.addLayer(this.vectorLayer);
    this.center(lat, lng);
  }
}

const cssUnitsPattern = /([A-Za-z%]+)$/;
function coerceCssPixelValue(value: any): string {
  if (value == null) return '';
  return cssUnitsPattern.test(value) ? value : value + 'px';
}
