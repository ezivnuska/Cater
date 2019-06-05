import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Carousel from 'react-native-snap-carousel';


class WelcomeCarousel extends React.Component {
  _renderItem = ({item, index}) => {
    return (
      <View style={styles.item}>
          <Image source={item.img} style={styles.img}/>
      </View>
    );
  }

  render() {
    const data = [
      {
        name: 'panda',
        nums: 10,
        img: require('../../../assets/photo/f-panda.png'),
      },
      {
        name: 'snake',
        nums: 20,
        img: require('../../../assets/photo/r-green-snake.png'),
      },
      {
        name: 'clownfish',
        nums: 10,
        img: require('../../../assets/photo/a-clownfish.png'),
      },
      {
        name: 'cockatiel parrot',
        nums: 10,
        img: require('../../../assets/photo/b-cockatiel-parrot.png'),
      },
      {
        name: 'red eyed tree frog',
        nums: 10,
        img: require('../../../assets/photo/r-red-eyed-tree-frog.png'),
      },
    ];

    return (
      <View style={styles.container}>
        <Carousel
          ref={(c) => { this._carousel = c; }}
          data={data}
          renderItem={this._renderItem}
          sliderWidth={250}
          sliderHeight={250}
          itemWidth={250}
          itemHeight={200}
          autoplay={true}
          enableMomentum={false}
          lockScrollWhileSnapping={true}
          enableSnap={true}
          loop={true}
          autoplayInterval={3000}
          layout={'stack'}
        />
      </View>
    );
  }
}

export default WelcomeCarousel;

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 230,
    backgroundColor: '#EF823F',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#2F1A0C',
    shadowOffset: {width: 1, height: 1},
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  item: {
    width: 250,
    height: 200,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRadius:  5,
    marginTop: 15,
  },
  img: {
    width: 250, 
    height: 180, 
    borderRadius: 5
  },
});