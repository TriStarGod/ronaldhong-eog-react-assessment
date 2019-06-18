import React, { useEffect, useState } from "react";
import { useQuery, useSubscription } from "urql";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../store/actions";
import Charts from "./Charts";
import { Dropdown } from "semantic-ui-react";
import CircularProgress from "@material-ui/core/LinearProgress";
import Container from "@material-ui/core/Container";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

const current_time = new Date().valueOf();
const query_metric = `
    query {
        getMetrics
    }`;

const query_multiple_measurements = `
    query($input: [MeasurementQuery] = [
      {metricName: "tubingPressure", after: ${current_time -
        180000}, before: ${current_time}},
      {metricName: "casingPressure", after: ${current_time -
        180000}, before: ${current_time}},
      {metricName: "oilTemp", after: ${current_time -
        180000}, before: ${current_time}},
      {metricName: "flareTemp", after: ${current_time -
        180000}, before: ${current_time}},
      {metricName: "waterTemp", after: ${current_time -
        180000}, before: ${current_time}},
      {metricName: "injValveOpen", after: ${current_time -
        180000}, before: ${current_time}}
    ]
    ){
      getMultipleMeasurements(input: $input) {
        metric
        measurements {
         at
         value
         metric
         unit
        }
      }
    }`;
const metric_Subscription_Query = `
  subscription {
    newMeasurement{
      metric
      at
      value
      unit
    }
  }
`;

const getMetric = state => {
  const getMetrics = state.metric.getMetrics;
  return getMetrics;
};

// const getNewMeasurementData = state => {
//   const getNewMeasurementDatas =
//     state.metricsMeasurements.getMultipleMeasurements;
//   return getNewMeasurementDatas;
// };

export default () => {
  return <MetricList />;
};

const FetchMetricList = () => {
  let query = query_metric;
  const dispatch = useDispatch();
  let [result] = useQuery({
    query,
    variables: {}
  });
  const { fetching, data, error } = result;

  useEffect(() => {
    if (error) {
      return;
    }
    if (!data) {
      return;
    }
    if (fetching) {
      return;
    }
    const getMetrics = data;
    dispatch({ type: actions.METRICS_DATA_RECEIVED, getMetrics });
  }, [dispatch, data, error, fetching]);
};

const FetchMultipleMeasurements = () => {
  const dispatch = useDispatch();
  let [result] = useQuery({
    query: query_multiple_measurements,
    variable: []
  });
  const { data, error, fetching } = result;
  useEffect(() => {
    if (error) {
      return;
    }
    if (!data) {
      return;
    }
    if (fetching) {
      return;
    }
    const getMultipleMeasurements = data;
    dispatch({
      type: actions.METRICS_MEASUREMENTS_RECEIVED,
      getMultipleMeasurements
    });
  }, [dispatch, data, error, fetching]);
};

const turnMetricListToDropDownFormat = (options, getMetrics) => {
  getMetrics.getMetrics.forEach(value => {
    let obj = { key: value, text: value, value: value };
    options.push(obj);
  });
  return options;
};

const FetchNewMeasurementData = (state) => {
  ///FetchNewMeasurementData has real time data, dispatch an action and will update the total measurement data
  const dispatch = useDispatch();
  const [result] = useSubscription({
    query: metric_Subscription_Query,
    variables: {}
  });
  const { data, error } = result;
  useEffect(() => {
    if (error) {
      return;
    }
    if (!data) {
      return;
    }
    const newMeasurementData = data;
    if (state.checkedB === true)
      dispatch({
        type: actions.NEW_MEASUREMENTS_RECEIVED,
        newMeasurementData
      });
  }, [data, error, dispatch, state]);
};

const MetricList = () => {
  const [state, setState] = React.useState({
    checkedB: true,
    value: []
  });
  FetchMetricList(); ///get the list of metrics for dropdown
  FetchMultipleMeasurements();
  FetchNewMeasurementData(state);
  const getMetrics = useSelector(getMetric);
  let options = [];
  if (getMetrics.length === 0) return <CircularProgress />;
  options = turnMetricListToDropDownFormat(options, getMetrics);

  const handleSelectionChange = (event, { value }) => {
    setState({ ...state, value });
  };
  const handleChange = name => event => {
    setState({ ...state, [name]: event.target.checked });
  };
  console.log(state);

  return (
    <div>
      <div style={{ textAlign: "right" }}>
        <FormControlLabel
          control={
            <Switch
              checked={state.checkedB}
              onChange={handleChange("checkedB")}
              value="checkedB"
              color="primary"
            />
          }
          label="real-time"
        />
      </div>
      <Container maxWidth="sm">
        <Dropdown
          placeholder="Select..."
          fluid
          multiple
          selection
          options={options}
          style={{ margin: "30px" }}
          onChange={handleSelectionChange}
        />
      </Container>
      <div style={{ margin: "30px" }}>
        <Charts command={state} />
      </div>
    </div>
  );
};
