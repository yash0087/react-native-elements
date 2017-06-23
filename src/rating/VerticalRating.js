import times from 'lodash.times';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';

import Text from '../text/Text';

const STAR_IMAGE = require('./images/star.png');
const HEART_IMAGE = require('./images/heart.png');
const ROCKET_IMAGE = require('./images/rocket.png');
const BELL_IMAGE = require('./images/bell.png');

const STAR_HEIGHT = 60;

const TYPES = {
  star: {
    source: STAR_IMAGE,
    color: '#f1c40f',
    backgroundColor: 'white',
  },
  heart: {
    source: HEART_IMAGE,
    color: '#e74c3c',
    backgroundColor: 'white',
  },
  rocket: {
    source: ROCKET_IMAGE,
    color: '#2ecc71',
    backgroundColor: 'white',
  },
  bell: {
    source: BELL_IMAGE,
    color: '#f39c12',
    backgroundColor: 'white',
  },
};

export default class VerticalRating extends Component {
  static defaultProps = {
    type: TYPES.star,
    ratingImage: TYPES.star.source,
    ratingColor: TYPES.star.color,
    ratingBackgroundColor: TYPES.star.backgroundColor,
    ratingCount: 5,
    imageSize: STAR_HEIGHT,
    onFinishRating: () => console.log('Attach a function here.'),
  };

  constructor(props) {
    super(props);

    const { onFinishRating, fractions } = this.props;

    const position = new Animated.ValueXY();

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        const newPosition = new Animated.ValueXY();
        newPosition.setValue({ x: 0, y: gesture.dy });
        this.setState({ position: newPosition, value: gesture.dy });
      },
      onPanResponderRelease: event => {
        const rating = this.getCurrentRating();
        if (!fractions) {
          // "round up" to the nearest star/rocket/whatever
          this.setCurrentRating(rating);
        }
        onFinishRating(rating);
      },
    });

    this.state = { panResponder, position };
  }

  componentDidMount() {
    this.setCurrentRating(this.props.startingValue);
  }

  getPrimaryViewStyle() {
    const { position } = this.state;
    const { imageSize, ratingCount, ratingColor } = this.props;

    const color = ratingColor;

    const height = position.y.interpolate(
      {
        inputRange: [
          -ratingCount * (imageSize / 2),
          0,
          ratingCount * (imageSize / 2),
        ],
        outputRange: [0, ratingCount * imageSize / 2, ratingCount * imageSize],
        extrapolate: 'clamp',
      },
      { useNativeDriver: true }
    );

    return {
      backgroundColor: color,
      width: height ? imageSize : 0,
      height,
    };
  }

  getSecondaryViewStyle() {
    const { position } = this.state;
    const { imageSize, ratingCount, ratingBackgroundColor } = this.props;

    const backgroundColor = ratingBackgroundColor;

    const height = position.y.interpolate(
      {
        inputRange: [
          -ratingCount * (imageSize / 2),
          0,
          ratingCount * (imageSize / 2),
        ],
        outputRange: [ratingCount * imageSize, ratingCount * imageSize / 2, 0],
        extrapolate: 'clamp',
      },
      { useNativeDriver: true }
    );

    return {
      backgroundColor,
      width: height ? imageSize : 0,
      height,
    };
  }

  renderRatings() {
    const { imageSize, ratingCount, ratingImage } = this.props;
    const source = ratingImage;

    return times(ratingCount, index =>
      <View key={index} style={styles.starContainer}>
        <Image
          source={source}
          style={{ width: imageSize, height: imageSize }}
        />
      </View>
    );
  }

  getCurrentRating() {
    const { value } = this.state;
    const { fractions, imageSize, ratingCount } = this.props;
    const startingValue = ratingCount / 2;
    let currentRating = 0;

    if (value > ratingCount * imageSize / 2) {
      currentRating = ratingCount;
    } else if (value < -ratingCount * imageSize / 2) {
      currentRating = 0;
    } else if (value < imageSize || value > imageSize) {
      currentRating = startingValue + value / imageSize;
      currentRating = !fractions
        ? Math.ceil(currentRating)
        : +currentRating.toFixed(fractions);
    } else {
      currentRating = !fractions
        ? Math.ceil(startingValue)
        : +startingValue.toFixed(fractions);
    }

    return currentRating;
  }

  setCurrentRating(rating) {
    const { imageSize, ratingCount } = this.props;
    // `initialRating` corresponds to `startingValue` in the getter. Naming it
    // differently here avoids confusion with `value` below.
    const initialRating = ratingCount / 2;
    let value = null;

    if (rating > ratingCount) {
      value = ratingCount * imageSize / 2;
    } else if (rating < 0) {
      value = -ratingCount * imageSize / 2;
    } else if (rating < ratingCount / 2 || rating > ratingCount / 2) {
      value = (rating - initialRating) * imageSize;
    } else {
      value = 0;
    }

    const newPosition = new Animated.ValueXY();
    newPosition.setValue({ x: 0, y: value });
    this.setState({ position: newPosition, value });
  }

  displayCurrentRating() {
    const { ratingCount, type, readonly } = this.props;

    const color = TYPES[type].color;

    return (
      <View style={styles.showRatingView}>
        <View style={styles.ratingView}>
          <Text style={styles.ratingText}>Rating: </Text>
          <Text style={[styles.currentRatingText, { color }]}>
            {this.getCurrentRating()}
          </Text>
          <Text style={styles.maxRatingText}>/{ratingCount}</Text>
        </View>
        <View>
          {readonly && <Text style={styles.readonlyLabel}>(readonly)</Text>}
        </View>
      </View>
    );
  }

  render() {
    const {
      readonly,
      type,
      ratingImage,
      ratingColor,
      ratingBackgroundColor,
      style,
      showRating,
    } = this.props;

    if (type === 'custom') {
      let custom = {
        source: ratingImage,
        color: ratingColor,
        backgroundColor: ratingBackgroundColor,
      };
      TYPES.custom = custom;
    }

    return (
      <View pointerEvents={readonly ? 'none' : 'auto'} style={style}>
        {showRating && this.displayCurrentRating()}
        <View
          style={styles.starsWrapper}
          {...this.state.panResponder.panHandlers}
        >
          <View style={styles.starsInsideWrapper}>
            <Animated.View style={this.getPrimaryViewStyle()} />
            <Animated.View style={this.getSecondaryViewStyle()} />
          </View>
          {this.renderRatings()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  starsWrapper: {
    flexDirection: 'column',
  },
  starsInsideWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'column',
  },
  showRatingView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 5,
  },
  ratingView: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 5,
  },
  ratingText: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : null,
    color: '#34495e',
  },
  readonlyLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : null,
    color: '#34495a',
  },
  currentRatingText: {
    fontSize: 30,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : null,
  },
  maxRatingText: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : null,
    color: '#34495e',
  },
});

const fractionsType = (props, propName, componentName) => {
  if (props[propName]) {
    const value = props[propName];
    if (typeof value === 'number') {
      return value >= 0 && value <= 20
        ? null
        : new Error(
            `\`${propName}\` in \`${componentName}\` must be between 0 and 20`
          );
    }

    return new Error(
      `\`${propName}\` in \`${componentName}\` must be a number`
    );
  }
};

VerticalRating.propTypes = {
  type: PropTypes.string,
  ratingImage: Image.propTypes.source,
  ratingColor: PropTypes.string,
  ratingBackgroundColor: PropTypes.string,
  ratingCount: PropTypes.number,
  imageSize: PropTypes.number,
  onFinishRating: PropTypes.func,
  showRating: PropTypes.bool,
  style: View.propTypes.style,
  readonly: PropTypes.bool,
  startingValue: PropTypes.number,
  fractions: fractionsType,
};
