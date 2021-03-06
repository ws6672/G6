/**
 * @fileOverview 自定义 Shape 的基类
 * @author dxq613@gmail.com
 */

import GGroup from '@antv/g-canvas/lib/group';
import { IShape } from '@antv/g-canvas/lib/interfaces'
import { upperFirst } from '@antv/util'
import { ShapeOptions } from '../interface/shape'
import { IPoint, Item, ModelConfig } from '../types';

const cache = {} // ucfirst 开销过大，进行缓存
// 首字母大写
function ucfirst(str) {
  if (!cache[str]) {
    cache[str] = upperFirst(str)
  }
  return cache[str]
}

/**
 * 工厂方法的基类
 * @type Shape.FactoryBase
 */
const ShapeFactoryBase = {
  /**
   * 默认的形状，当没有指定/匹配 shapeType 时，使用默认的
   * @type {String}
   */
  defaultShapeType: 'defaultType',
  /**
   * 形状的 className，用于搜索
   * @type {String}
   */
  className: null,
  /**
   * 获取绘制 Shape 的工具类，无状态
   * @param  {String} type 类型
   * @return {Shape} 工具类
   */
  getShape(type?: string): ShapeOptions {
    const self = this
    const shape = self[type] || self[self.defaultShapeType]
    return shape
  },
  /**
   * 绘制图形
   * @param  {String} type  类型
   * @param  {Object} cfg 配置项
   * @param  {G.Group} group 图形的分组
   * @return {IShape} 图形对象
   */
  draw(type: string, cfg: ModelConfig, group: GGroup): IShape {
    const shape = this.getShape(type)
    const rst = shape.draw(cfg, group)
    shape.afterDraw(cfg, group, rst)
    return rst
  },
  /**
   * 更新
   * @param  {String} type  类型
   * @param  {Object} cfg 配置项
   * @param  {G6.Item} item 节点、边、分组等
   */
  update(type: string, cfg: ModelConfig, item: Item) {
    const shape = this.getShape(type)
    if (shape.update) { // 防止没定义 update 函数
      shape.update(cfg, item)
      shape.afterUpdate(cfg, item)
    }
  },
  /**
   * 设置状态
   * @param {String} type  类型
   * @param {String} name  状态名
   * @param {String | Boolean} value 状态值
   * @param {G6.Item} item  节点、边、分组等
   */
  setState(type: string, name: string, value: string | boolean, item: Item) {
    const shape = this.getShape(type)
    shape.setState(name, value, item)
  },
  /**
   * 是否允许更新，不重新绘制图形
   * @param  {String} type 类型
   * @return {Boolean} 是否允许使用更新
   */
  shouldUpdate(type: string): boolean {
    const shape = this.getShape(type)
    return !!shape.update
  },
  getControlPoints(type: string, cfg: ModelConfig): IPoint[] {
    const shape = this.getShape(type)
    return shape.getControlPoints(cfg)
  },
  /**
   * 获取控制点
   * @param {String} type 节点、边类型
   * @param  {Object} cfg 节点、边的配置项
   * @return {Array|null} 控制点的数组,如果为 null，则没有控制点
   */
  getAnchorPoints(type: string, cfg: ModelConfig): IPoint[] {
    const shape = this.getShape(type)
    return shape.getAnchorPoints(cfg)
  }
}


/**
 * 元素的框架
 */
const ShapeFramework = {
  // 默认样式及配置
  options: {},
  /**
	 * 用户自定义节点或边的样式，初始渲染时使用
	 * @override
	 * @param  {Object} model 节点的配置项
	 */
  getCustomConfig(/* model */) {},
  /**
   * 绘制
   */
  draw(/* cfg, group */) {

  },
  /**
   * 绘制完成后的操作，便于用户继承现有的节点、边
   */
  afterDraw(/* cfg, group */) {

  },
  // update(cfg, item) // 默认不定义
  afterUpdate(/* cfg, item */) {

  },
  /**
   * 设置节点、边状态
   */
  setState(/* name, value, item */) {

  },
  /**
   * 获取控制点
   * @param  {Object} cfg 节点、边的配置项
   * @return {Array|null} 控制点的数组,如果为 null，则没有控制点
   */
  getControlPoints(cfg) {
    return cfg.controlPoints;
  },
  /**
   * 获取控制点
   * @param  {Object} cfg 节点、边的配置项
   * @return {Array|null} 控制点的数组,如果为 null，则没有控制点
   */
  getAnchorPoints(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {};
    const { anchorPoints: defaultAnchorPoints } = this.options;
    const { anchorPoints: customAnchorPoints } = customOptions;
    const anchorPoints = cfg.anchorPoints || customAnchorPoints || defaultAnchorPoints;
    return anchorPoints;
  }
  /* 如果没定义 update 方法，每次都调用 draw 方法
  update(cfg, item) {

  }
  */
};


export default class Shape {
  public static Node;
  public static Edge;
  public static registerFactory(factoryType: string, cfg: object): object {
    const className = ucfirst(factoryType)
    const factoryBase = ShapeFactoryBase
    const shapeFactory = Object.assign({}, factoryBase, cfg)
    Shape[className] = shapeFactory
    shapeFactory.className = className
    // addRegister(shapeFactory)
    return shapeFactory
  }
  public static getFactory(factoryType: string) {
    // const self = this
    const className = ucfirst(factoryType)
    return Shape[className]
  }
  public static registerNode(shapeType: string, nodeDefinition: ShapeOptions, extendShapeType?: string) {
    const shapeFactory = Shape.Node;
    const extendShape = extendShapeType ? shapeFactory.getShape(extendShapeType) : ShapeFramework;

    const shapeObj = Object.assign({}, extendShape, nodeDefinition)
    shapeObj.type = shapeType
    shapeObj.itemType = 'node'
    shapeFactory[shapeType] = shapeObj
    return shapeObj
  }
  public static registerEdge(shapeType: string, edgeDefinition: ShapeOptions, extendShapeType?: string) {
    const shapeFactory = Shape.Edge;
    const extendShape = extendShapeType ? shapeFactory.getShape(extendShapeType) : ShapeFramework;
    const shapeObj = Object.assign({}, extendShape, edgeDefinition)
    shapeObj.type = shapeType
    shapeObj.itemType = 'edge'
    shapeFactory[shapeType] = shapeObj
    return shapeObj
  }
}


// 注册 Node 的工厂方法
Shape.registerFactory('node', {
  defaultShapeType: 'circle'
});

// 注册 Edge 的工厂方法
Shape.registerFactory('edge', {
  defaultShapeType: 'line'
});