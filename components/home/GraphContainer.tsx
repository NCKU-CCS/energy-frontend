import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { runtimeConfig } from '../../utils';

import { testing_data } from './data';
import {
  buildings_pos,
  buildings_name_pos,
  paths,
  achieve_pos,
} from './coordinate';

const url_userInfo = `${runtimeConfig.MAIN_HOST}/user`;

const Block = styled.canvas`
  width: 100%;
  height: 464px;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.16);
  background-color: #fff;
  margin-top: 26px;
`;

const emptyData = {
  date: '2019/01/01',
  time: '00:00',
  transactions: [
    {
      seller: 'NCKU_BEMS',
      buyer: 'NCKU_BEMS',
      achievement: 0.0,
    },
  ],
};

const GraphContainer: React.FC = () => {
  const [inputData, setInputData] = useState(emptyData);
  const [currUser, setCurrUser] = useState('');
  // 4*4 matrix, record if the lighting are triggered and the role of transaction
  const [lightingType, setLightingType] = useState([
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
    'off',
  ]);
  const [dataReady, setDataReady] = useState(false);
  // parameter
  const refreshTime = 50;
  const buildings = ['Carlab_BEMS', 'NCKU_BEMS', 'SGESC_C_BEMS', 'ABRI_BEMS'];
  // lighting info, record each lighting's position
  const lighting_pos: number[][] = [];
  // lighting info, record each lighting is on which fragment of it's path
  const lighting_frag: number[] = [];
  // define image
  let building1: HTMLImageElement;
  let building2: HTMLImageElement;
  let building3: HTMLImageElement;
  let building4: HTMLImageElement;

  // useEffect(() => {console.log(lightingType)}, [lightingType]);

  // init data
  useEffect(() => {
    (async () => {
      /**
       * testing data, need to change these data source to API
       * inputData: transmission data
       */
      setInputData(testing_data);

      // set currUser
      const { bearer } = JSON.parse(localStorage.getItem('BEMS_user'));
      const res = await fetch(`${url_userInfo}`, {
        mode: 'cors',
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        }),
      });
      const userInfo = await res.json();
      setCurrUser(userInfo.account);
    })();
  }, []);

  // init graph
  useEffect(() => {
    if (inputData !== emptyData && currUser && dataReady) {
      initDraw();
    }
  }, [inputData, currUser, dataReady]);

  useEffect(() => {
    if (inputData !== emptyData && currUser) {
      // init lighting info.
      const currLightingType = [
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
        'off',
      ];
      for (const data of inputData.transactions) {
        // just set info related to currUser
        if (data.buyer !== currUser && data.seller !== currUser) {
          continue;
        }
        const seller_index = buildings.indexOf(data.seller);
        const buyer_index = buildings.indexOf(data.buyer);
        const lighting_index = seller_index * 4 + buyer_index;
        currLightingType[lighting_index] =
          data.seller === currUser ? 'sell' : 'buy';
      }
      setLightingType(currLightingType);
      setDataReady(true);
    }
  }, [inputData, currUser]);

  function initDraw() {
    // init img element
    building1 = document.createElement('img');
    building2 = document.createElement('img');
    building3 = document.createElement('img');
    building4 = document.createElement('img');
    // load image
    building1.src = `/static/home/Carlab.png`;
    building2.src = `/static/home/NCKU.png`;
    building3.src = `/static/home/SGESC_C.png`;
    building4.src = `/static/home/ABRI.png`;

    // init lighing pos & frag
    for (const path of paths) {
      if (path.length === 0) {
        // if no path, push -1
        lighting_pos.push([-1, -1]);
        lighting_frag.push(-1);
      } else {
        lighting_pos.push(path[0].slice(0));
        lighting_frag.push(0);
      }
    }

    setInterval(drawGraph, refreshTime);
  }

  function drawGraph() {
    // init canvas
    const canvas = document.getElementById('transmit') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 2700, 930);

    // draw path
    for (const path of paths) {
      drawPath(ctx, path);
    }

    // draw achievement
    for (const transaction of inputData.transactions) {
      const index =
        4 * buildings.indexOf(transaction.seller) +
        buildings.indexOf(transaction.buyer);
      if (lightingType[index] === 'off') {
        continue;
      }
      drawAchievement(
        ctx,
        achieve_pos[index][0],
        achieve_pos[index][1],
        lightingType[index],
        transaction.achievement,
      );
    }

    drawLightings(ctx, lightingType);

    // draw building
    ctx.drawImage(building1, buildings_pos[0][0], buildings_pos[0][1]);
    ctx.drawImage(building2, buildings_pos[1][0], buildings_pos[1][1]);
    ctx.drawImage(building3, buildings_pos[2][0], buildings_pos[2][1]);
    ctx.drawImage(building4, buildings_pos[3][0], buildings_pos[3][1]);

    // draw buildings' name
    drawBuildingName(ctx);
  }

  function drawPath(ctx: CanvasRenderingContext2D, path_info: number[][]) {
    if (path_info.length < 2) {
      return 0;
    }
    ctx.save();
    // setting style
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 7;
    // draw
    ctx.beginPath();
    ctx.moveTo(path_info[0][0], path_info[0][1]);
    for (let i = 1; i < path_info.length; i++) {
      ctx.lineTo(path_info[i][0], path_info[i][1]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  function drawLightings(
    ctx: CanvasRenderingContext2D,
    lighting_type: string[],
  ) {
    for (let i = 0; i < lighting_type.length; i++) {
      if (i % 5 === 0) {
        // pass 1-1, 2-2, 3-3, 4-4
        continue;
      }
      if (lighting_type[i] === 'off') {
        // init lighting info
        lighting_pos[i] = paths[i][0].slice(0);
        lighting_frag[i] = 0;
      } else {
        // draw
        const frag_index = lighting_frag[i];
        const slope =
          (paths[i][frag_index + 1][1] - paths[i][frag_index][1]) /
          (paths[i][frag_index + 1][0] - paths[i][frag_index][0]);
        const arc = Math.atan(slope); // transfer slope to radian
        drawLighting(
          ctx,
          lighting_pos[i][0],
          lighting_pos[i][1],
          lighting_type[i],
          arc,
        );
        // move right
        if (paths[i][frag_index + 1][0] > paths[i][frag_index][0]) {
          if (lighting_pos[i][0] + 5 < paths[i][frag_index + 1][0]) {
            lighting_pos[i][0] += 5; // move x
            lighting_pos[i][1] += 5 * slope; // move y
          } else {
            // move to next fragment
            lighting_frag[i] = (lighting_frag[i] + 1) % (paths[i].length - 1);
            lighting_pos[i] = paths[i][lighting_frag[i]].slice(0);
          }
        }
        // move left
        else {
          if (lighting_pos[i][0] - 5 > paths[i][frag_index + 1][0]) {
            lighting_pos[i][0] -= 5; // move x
            lighting_pos[i][1] -= 5 * slope; // move y
          } else {
            // move to next fragment
            lighting_frag[i] = (lighting_frag[i] + 1) % (paths[i].length - 1);
            lighting_pos[i] = paths[i][lighting_frag[i]].slice(0);
          }
        }
      }
    }
  }

  function drawLighting(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    arc: number,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(arc);
    ctx.fillStyle = type === 'sell' ? '#d32f2f' : '#2e7d32';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -18);
    ctx.lineTo(9, 0);
    ctx.moveTo(6, 0);
    ctx.lineTo(3, 18);
    ctx.lineTo(15, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawBuildingName(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = '40px Roboto';
    for (let i = 0; i < buildings_name_pos.length; i++) {
      ctx.fillStyle = buildings[i] === currUser ? '#ffa000' : '#000000';
      ctx.fillText(
        buildings[i],
        buildings_name_pos[i][0],
        buildings_name_pos[i][1],
      );
    }
    ctx.restore();
  }

  function drawAchievement(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    achieve: number,
  ) {
    ctx.save();
    ctx.font = '40px Roboto';
    ctx.fillStyle = type === 'sell' ? '#d32f2f' : '#2e7d32';
    ctx.fillText((achieve * 100).toString() + '%', x, y);
    ctx.restore();
  }

  return <Block id="transmit" width="2700" height="930" />;
};

export default GraphContainer;
